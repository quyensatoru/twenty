import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  enqueueSnackbar,
  t,
  useFrontComponentExecutionContext,
} from 'twenty-sdk/front-component';
import {
  IconCheckbox,
  IconFlag,
  IconLayoutSidebar,
  IconPlus,
  IconCalendarRepeat,
  IconStack2,
  IconUserCircle,
} from 'twenty-ui/icon';

import { BOARD_ACTIVE_SPRINT } from '../constants/board-active-sprint';
import { ISSUE_PRIORITY_OPTIONS } from '../constants/issue-priority-options';
import { ISSUE_TYPE_OPTIONS } from '../constants/issue-type-options';
import {
  ISSUE_CARD_FIELDS,
  type IssueCardFieldKey,
} from '../constants/issue-view-fields';
import {
  TASK_BOARD_ROUTE_PATH,
  UPDATE_ISSUE_ROUTE_PATH,
  UPDATE_ISSUE_VIEW_SETTINGS_ROUTE_PATH,
} from '../constants/route-paths';
import { TASK_BOARD_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { BACKLOG_SECTION_KEY } from '../types/backlog';
import {
  type BoardData,
  type BoardEpic,
  type BoardIssue,
  type BoardMember,
  type BoardSprint,
  type BoardViewMode,
  type PageInset,
} from '../types/task-board';
import { readEpicColor } from '../utils/epic-color.util';
import { readBoardIssueSort } from '../utils/read-board-issue-sort.util';
import { readIssueViewSettings } from '../utils/read-issue-view-settings.util';
import {
  TaskBoardAssigneeFilter,
  type TaskBoardAssigneeOption,
  UNASSIGNED_ASSIGNEE_VALUE,
} from './components/task-board-assignee-filter';
import { TaskAvatar } from './components/task-avatar';
import { TaskBacklogView } from './components/task-backlog-view';
import { IssueTypeGlyph, UnassignedAvatar } from './components/task-board-card';
import { TaskBoardSelect } from './components/task-board-select';
import { TaskBoardSortMenu } from './components/task-board-sort-menu';
import { TaskBoardSkeleton } from './components/task-board-skeleton';
import { NO_STATUS_VALUE, TaskBoardView } from './components/task-board-view';
import { TaskDiscussionNotifications } from './components/task-discussion-notifications';
import { TaskButton } from './components/task-button';
import { TaskCompleteSprintDialog } from './components/task-complete-sprint-dialog';
import { type EpicFilter, TaskEpicPanel } from './components/task-epic-panel';
import { TaskColorDot, TaskFilterChip } from './components/task-chip';
import { TaskFieldsMenu } from './components/task-fields-menu';
import {
  TaskFilterMenu,
  type TaskFilterMenuField,
} from './components/task-filter-menu';
import { TaskFilterToggle } from './components/task-filter-toggle';
import { TaskIssueSearch } from './components/task-issue-search';
import { TaskMessage } from './components/task-message';
import { TaskPriorityGlyph } from './components/task-priority-glyph';
import { TaskSprintDialog } from './components/task-sprint-dialog';
import {
  TaskNoActiveSprintBanner,
  TaskSprintHeader,
} from './components/task-sprint-header';
import { readTagColor, TASK_TOKENS } from './components/task-tokens';
import { TaskProjectBadge, TaskToolbarToggle } from './components/task-toolbar';
import { TaskViewSwitch } from './components/task-view-switch';
import { useBoardSortPreference } from './hooks/use-board-sort-preference';
import { useIsMobile } from './hooks/use-is-mobile';
import {
  parseBoardIssueAnchor,
  parseBoardViewAnchor,
} from './utils/parse-board-anchor.util';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';
import { readMemberName } from './utils/read-member-name.util';
import { summarizeBoardProgress } from './utils/summarize-board-progress.util';

const ALL_VALUE = 'ALL';
const BACKLOG_VALUE = 'BACKLOG';
const NO_EPIC_VALUE = 'NO_EPIC';
const ACTIVE_SPRINT_VALUE = BOARD_ACTIVE_SPRINT;
const PROJECT_STORAGE_KEY = 'task-board.project-id';
const VIEW_STORAGE_KEY = 'task-board.view';
const EPIC_PANEL_STORAGE_KEY = 'task-board.epic-panel-open';

// The sandbox's localStorage is seeded from the host before the first render,
// so these read synchronously. Guarded anyway: a store that is missing or
// full must never take the board down with it.
const readStoredValue = (key: string): string | null => {
  try {
    const value = localStorage.getItem(key);

    return value === null || value === '' ? null : value;
  } catch {
    return null;
  }
};

const storeValue = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // A convenience only: the board still opens, on its defaults.
  }
};

const readStoredView = (): BoardViewMode =>
  readStoredValue(VIEW_STORAGE_KEY) === 'backlog' ? 'backlog' : 'board';

// The Jira-style planning page: one project at a time, seen as its Backlog
// (sprints and backlog as ranked lists) or its Board (the active sprint as
// status columns), with the epic panel beside either and the issue detail as
// a drawer. Filters, project and open issue survive switching views.
//
// Everything here is app-drawn — plain elements, TASK_TOKENS and twenty-ui
// icons only. No host widget is used: a host board would be one shared view
// for the whole workspace, while every usable board here is scoped to one
// project (which is also what seeds a new card so the row-level predicate
// accepts the write), and host widgets read with the viewer's own token while
// this app's reads go through its scoped routes.
const TaskBoard = () => {
  // Pinned to the published SDK, whose context type predates these fields.
  // The host sends them (useFrontComponentExecutionContext in twenty-front);
  // drop the casts once the app moves to an SDK that declares them.
  const locationHash = useFrontComponentExecutionContext(
    (context) => (context as { locationHash?: string }).locationHash ?? '',
  );
  const isMobile = useIsMobile();
  const boardPath = useFrontComponentExecutionContext((context) => {
    const pathname = (context as { locationPathname?: string })
      .locationPathname;

    return typeof pathname === 'string' && pathname !== '' ? pathname : null;
  });
  const [board, setBoard] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // The project the reader last looked at, so the board does not open on the
  // alphabetically first project — in production also the heaviest one. The
  // route falls back to a visible project if this one is no longer visible.
  const [projectId, setProjectId] = useState<string | null>(() =>
    readStoredValue(PROJECT_STORAGE_KEY),
  );
  const [view, setView] = useState<BoardViewMode>(
    () => parseBoardViewAnchor(locationHash) ?? readStoredView(),
  );
  const [isEpicPanelOpen, setIsEpicPanelOpen] = useState(
    () => readStoredValue(EPIC_PANEL_STORAGE_KEY) === 'true',
  );
  const [shouldIncludeOlderDone, setShouldIncludeOlderDone] = useState(false);
  const [loadingColumnKeys, setLoadingColumnKeys] = useState<string[]>([]);
  // Bumped on every full load, so a column page that was in flight when the
  // project or a filter changed is dropped instead of landing on the new board.
  // oxlint-disable-next-line twenty/no-state-useref
  const boardGenerationRef = useRef(0);
  // oxlint-disable-next-line twenty/no-state-useref
  const cardFieldsWriteQueueRef = useRef<Promise<void>>(Promise.resolve());
  // Like a Jira board, the board opens on the active sprint.
  const [sprintFilter, setSprintFilter] = useState<string>(ACTIVE_SPRINT_VALUE);
  const [epicFilter, setEpicFilter] = useState<EpicFilter>(undefined);
  const [search, setSearch] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [isOnlyMine, setIsOnlyMine] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>(ALL_VALUE);
  const [priorityFilter, setPriorityFilter] = useState<string>(ALL_VALUE);
  // A board deep link decides the opening modal, so a pasted link lands on
  // the issue it is about. It is the INITIAL value only: the reader keeps
  // whatever they open afterwards.
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(
    parseBoardIssueAnchor(locationHash),
  );
  const [composerStatusId, setComposerStatusId] = useState<string | null>(null);
  const [composerSectionKey, setComposerSectionKey] = useState<string | null>(
    null,
  );
  // A backlog row in flight, shared with the epic panel's drop targets.
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null);
  const [sprintDialogSprint, setSprintDialogSprint] =
    useState<BoardSprint | null>(null);
  const [completingSprint, setCompletingSprint] = useState<BoardSprint | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const sprintId =
    sprintFilter === ALL_VALUE
      ? undefined
      : sprintFilter === BACKLOG_VALUE
        ? null
        : sprintFilter;
  const currentMemberId = board?.currentWorkspaceMemberId ?? null;
  // Filters run on the server: a column only holds its first pages, so a
  // filter over the loaded cards would miss every card not loaded yet.
  const assigneeFilterIds = useMemo(
    () =>
      isOnlyMine
        ? currentMemberId === null
          ? []
          : [currentMemberId]
        : selectedAssigneeIds,
    [isOnlyMine, currentMemberId, selectedAssigneeIds],
  );
  const issueTypeFilter = typeFilter === ALL_VALUE ? null : typeFilter;
  const issuePriorityFilter =
    priorityFilter === ALL_VALUE ? null : priorityFilter;
  const {
    requestedSort,
    sort: boardSort,
    canAddRule: canAddSortRule,
    addRule: addSortRule,
    changeRuleField: changeSortRuleField,
    toggleRuleDirection: toggleSortRuleDirection,
    moveRuleUp: moveSortRuleUp,
    removeRule: removeSortRule,
    clearSort,
  } = useBoardSortPreference(board?.boardSort);

  // The filters the two views share. The backlog has no sprint filter: its
  // sections are the sprints.
  const sharedQueryBody = useMemo(
    () => ({
      ...(epicFilter === undefined ? {} : { epicId: epicFilter }),
      assigneeIds: assigneeFilterIds,
      issueType: issueTypeFilter,
      priority: issuePriorityFilter,
    }),
    [epicFilter, assigneeFilterIds, issueTypeFilter, issuePriorityFilter],
  );

  const boardQueryBody = useMemo(
    () => ({
      ...sharedQueryBody,
      ...(sprintId === undefined ? {} : { sprintId }),
      ...(requestedSort === null ? {} : { sort: requestedSort }),
      includeOlderDone: shouldIncludeOlderDone,
    }),
    [sharedQueryBody, sprintId, requestedSort, shouldIncludeOlderDone],
  );
  // A column's next pages must come in the order its first page did, which
  // may be the saved one the board load answered with.
  const columnQueryBody = useMemo(
    () => ({ ...boardQueryBody, sort: boardSort }),
    [boardQueryBody, boardSort],
  );

  const loadBoard = useCallback(async () => {
    boardGenerationRef.current += 1;
    setLoadingColumnKeys([]);

    try {
      const result = await postAppRoute<BoardData & { success: true }>(
        TASK_BOARD_ROUTE_PATH,
        {
          ...(projectId === null ? {} : { projectId }),
          ...boardQueryBody,
          // The backlog reads its own sections; the columns would be wasted.
          includeIssues: view === 'board',
        },
      );

      setBoard({
        projects: result.projects ?? [],
        activeProjectId: result.activeProjectId ?? null,
        issueStatuses: result.issueStatuses ?? [],
        sprints: result.sprints ?? [],
        activeSprintId: result.activeSprintId ?? null,
        epics: result.epics ?? [],
        issues: result.issues ?? [],
        columnPages: result.columnPages ?? {},
        members: result.members ?? [],
        assignableMembers: result.assignableMembers ?? [],
        currentWorkspaceMemberId: result.currentWorkspaceMemberId ?? null,
        hiddenDoneIssueCount: result.hiddenDoneIssueCount ?? 0,
        boardSort: readBoardIssueSort(result.boardSort),
        canWrite: result.canWrite === true,
        canSoftDelete: result.canSoftDelete === true,
        canManageViews: result.canManageViews === true,
      });
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  }, [projectId, boardQueryBody, view]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadBoard();
      setIsLoading(false);
    };

    void load();
  }, [loadBoard, refreshKey]);

  const refreshBoard = () => setRefreshKey((key) => key + 1);

  const changeView = (nextView: BoardViewMode) => {
    setView(nextView);
    storeValue(VIEW_STORAGE_KEY, nextView);
    setComposerStatusId(null);
    setComposerSectionKey(null);
  };

  const toggleEpicPanel = () => {
    const nextIsOpen = !isEpicPanelOpen;

    setIsEpicPanelOpen(nextIsOpen);
    storeValue(EPIC_PANEL_STORAGE_KEY, String(nextIsOpen));
  };

  // A global-search pick jumps the board to the result's project (when it is
  // a project on screen) and opens its modal. The typed query is cleared: it
  // filtered the old project's columns, and keeping it would hide the very
  // context just jumped to.
  const selectSearchResult = (issue: BoardIssue) => {
    if (
      typeof issue.projectId === 'string' &&
      issue.projectId !== '' &&
      (board?.projects ?? []).some((project) => project.id === issue.projectId)
    ) {
      setProjectId(issue.projectId);
    }

    setSearch('');
    setSelectedIssueId(issue.id);
  };

  const isFiltered =
    search.trim() !== '' ||
    sprintFilter !== ACTIVE_SPRINT_VALUE ||
    epicFilter !== undefined ||
    selectedAssigneeIds.length > 0 ||
    isOnlyMine ||
    typeFilter !== ALL_VALUE ||
    priorityFilter !== ALL_VALUE;
  // The sort only applies to the board view, so only there does it count as
  // something to clear.
  const isSorted = view === 'board' && boardSort.length > 0;

  const resetFilters = () => {
    setSearch('');
    setSprintFilter(ACTIVE_SPRINT_VALUE);
    setEpicFilter(undefined);
    setSelectedAssigneeIds([]);
    setIsOnlyMine(false);
    setTypeFilter(ALL_VALUE);
    setPriorityFilter(ALL_VALUE);

    if (isSorted) {
      void clearSort();
    }
  };

  // Picking faces and "Only my issues" are two ways to say whose cards to
  // show, so each one clears the other rather than intersecting into a board
  // that is empty for no visible reason.
  const toggleAssignee = (assigneeId: string) => {
    setIsOnlyMine(false);
    setSelectedAssigneeIds((current) =>
      current.includes(assigneeId)
        ? current.filter((id) => id !== assigneeId)
        : [...current, assigneeId],
    );
  };

  const toggleOnlyMine = () => {
    setSelectedAssigneeIds([]);
    setIsOnlyMine(!isOnlyMine);
  };

  // A subtask has no epic of its own in Jira: a subtask card dropped on an
  // epic plans its parent there, and the server carries the epic down.
  const assignIssueToEpic = async (issueId: string, epicId: string) => {
    setDraggingIssueId(null);

    const parentId = board?.issues.find(
      (issue) => issue.id === issueId,
    )?.parentId;

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId: typeof parentId === 'string' ? parentId : issueId,
        data: { epicId },
      });
      refreshBoard();
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    }
  };

  const membersById = useMemo(
    () =>
      new Map<string, BoardMember>(
        (board?.members ?? []).map((member) => [member.id, member]),
      ),
    [board],
  );

  const sprintNamesById = useMemo(
    () =>
      new Map(
        (board?.sprints ?? []).map((sprint) => [
          sprint.id,
          sprint.name ?? sprint.id,
        ]),
      ),
    [board],
  );

  const epicsById = useMemo(
    () =>
      new Map<string, BoardEpic>(
        (board?.epics ?? []).map((epic) => [epic.id, epic]),
      ),
    [board],
  );

  const activeProject = board?.projects.find(
    (project) => project.id === board.activeProjectId,
  );

  const hiddenCardFields = useMemo(
    () =>
      readIssueViewSettings(activeProject?.issueViewSettings).hiddenCardFields,
    [activeProject],
  );

  // Faces for the quick filter: everyone who can work on the project, so the
  // row is the same whatever is loaded or filtered, plus "Unassigned".
  const assigneeOptions = useMemo(() => {
    const assignableMembers = board?.assignableMembers ?? [];
    const assignableById = new Map(
      assignableMembers.map((member) => [member.id, member]),
    );
    const options: TaskBoardAssigneeOption[] = assignableMembers
      .map((member) => ({
        id: member.id,
        name: readMemberName(assignableById, member.id, t('Unknown')),
        avatarUrl: member.avatarUrl,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    return [
      ...options,
      { id: UNASSIGNED_ASSIGNEE_VALUE, name: t('Unassigned') },
    ];
  }, [board]);

  const statuses = useMemo(
    () =>
      [...(board?.issueStatuses ?? [])].sort(
        (left, right) => (left.position ?? 0) - (right.position ?? 0),
      ),
    [board],
  );

  const doneStatusIds = useMemo(
    () =>
      new Set(
        statuses
          .filter((status) => status.category === 'DONE')
          .map((status) => status.id),
      ),
    [statuses],
  );

  // Optimistic too: the cards change at once, and a refused write puts the
  // project's previous settings back.
  const saveHiddenCardFields = (nextHiddenFields: IssueCardFieldKey[]) => {
    const activeProjectId = board?.activeProjectId ?? null;

    if (board === null || activeProjectId === null) {
      return;
    }

    const previousProjects = board.projects;

    setBoard({
      ...board,
      projects: board.projects.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              issueViewSettings: {
                ...readIssueViewSettings(project.issueViewSettings),
                hiddenCardFields: nextHiddenFields,
              },
            }
          : project,
      ),
    });

    // In order, so a quick second toggle cannot be overwritten by the first.
    cardFieldsWriteQueueRef.current = cardFieldsWriteQueueRef.current.then(
      async () => {
        try {
          await postAppRoute(UPDATE_ISSUE_VIEW_SETTINGS_ROUTE_PATH, {
            projectId: activeProjectId,
            hiddenCardFields: nextHiddenFields,
          });
        } catch (error) {
          setBoard((current) =>
            current === null
              ? current
              : { ...current, projects: previousProjects },
          );
          void enqueueSnackbar({
            message: readErrorText(error),
            variant: 'error',
          });
        }
      },
    );
  };

  const closeSprintDialogsAndRefresh = () => {
    setSprintDialogSprint(null);
    setCompletingSprint(null);
    refreshBoard();
  };

  const pageInset: PageInset = isMobile
    ? { left: 12, right: 12 }
    : { left: 12, right: 20 };

  if (isLoading && board === null) {
    return (
      <TaskBoardFrame>
        <TaskBoardSkeleton
          view={view}
          isMobile={isMobile}
          isEpicPanelOpen={isEpicPanelOpen}
          inset={pageInset}
        />
      </TaskBoardFrame>
    );
  }

  if (board === null || loadError !== null) {
    return (
      <TaskBoardFrame>
        <TaskMessage
          text={loadError ?? t('The board is not available.')}
          tone="danger"
        />
      </TaskBoardFrame>
    );
  }

  if (board.projects.length === 0) {
    return (
      <TaskBoardFrame>
        <TaskMessage
          text={t(
            'No project is available to you yet. Ask for access to a Shopify app first.',
          )}
        />
      </TaskBoardFrame>
    );
  }

  const activeSprint = board.sprints.find(
    (sprint) => sprint.id === board.activeSprintId,
  );
  const isShowingActiveSprint =
    view === 'board' &&
    sprintFilter === ACTIVE_SPRINT_VALUE &&
    activeSprint !== undefined;
  // A single sprint on the board makes the sprint chip the same on every
  // card, so cards only carry it on a board that spans sprints.
  const isShowingSingleSprint =
    sprintFilter === ACTIVE_SPRINT_VALUE
      ? activeSprint !== undefined
      : sprintFilter !== ALL_VALUE && sprintFilter !== BACKLOG_VALUE;
  // A card created on the board joins what the board is showing, so it does
  // not vanish from a sprint or epic board the moment it exists.
  const newIssueSprintId =
    sprintFilter === ACTIVE_SPRINT_VALUE
      ? (activeSprint?.id ?? null)
      : sprintFilter === ALL_VALUE || sprintFilter === BACKLOG_VALUE
        ? null
        : sprintFilter;
  const newIssueEpicId = typeof epicFilter === 'string' ? epicFilter : null;
  const progress = summarizeBoardProgress({
    columnPages: board.columnPages,
    columnKeys: [...statuses.map((status) => status.id), NO_STATUS_VALUE],
    doneStatusIds,
    startedStatusIds: new Set(
      statuses
        .filter((status) => status.category === 'STARTED')
        .map((status) => status.id),
    ),
  });

  // On a phone the epic panel takes the whole page, like a screen of its own,
  // since there is no room beside the view for it.
  const isEpicPanelFullScreen = isMobile && isEpicPanelOpen;

  const openCreateIssue = () => {
    if (view === 'backlog') {
      setComposerSectionKey(BACKLOG_SECTION_KEY);

      return;
    }

    setComposerStatusId(statuses[0]?.id ?? NO_STATUS_VALUE);
  };

  const selectedTypeOption = ISSUE_TYPE_OPTIONS.find(
    (option) => option.value === typeFilter,
  );
  const selectedPriorityOption = ISSUE_PRIORITY_OPTIONS.find(
    (option) => option.value === priorityFilter,
  );
  const selectedAssigneeNames = selectedAssigneeIds.map(
    (assigneeId) =>
      assigneeOptions.find((option) => option.id === assigneeId)?.name ??
      t('Unknown'),
  );
  const readSprintFilterLabel = () => {
    if (sprintFilter === ALL_VALUE) {
      return t('All sprints');
    }

    if (sprintFilter === BACKLOG_VALUE) {
      return t('Backlog');
    }

    return sprintNamesById.get(sprintFilter) ?? t('Active sprint');
  };
  const selectedEpicLabel =
    epicFilter === null
      ? t('No epic')
      : typeof epicFilter === 'string'
        ? (epicsById.get(epicFilter)?.name ?? t('Unknown'))
        : null;
  const toggleSingleValue =
    (current: string, setValue: (value: string) => void) => (value: string) =>
      setValue(current === value ? ALL_VALUE : value);

  const filterFields: TaskFilterMenuField[] = [
    {
      key: 'assignee',
      label: t('Assignee'),
      icon: <IconUserCircle size={14} />,
      isMulti: true,
      selectedValues: selectedAssigneeIds,
      options: assigneeOptions.map((option) => ({
        value: option.id,
        label: option.name,
        icon:
          option.id === UNASSIGNED_ASSIGNEE_VALUE ? (
            <UnassignedAvatar size={18} />
          ) : (
            <TaskAvatar
              name={option.name}
              avatarUrl={option.avatarUrl}
              size={18}
              shouldShowTitle={false}
            />
          ),
      })),
      onToggle: toggleAssignee,
    },
    {
      key: 'priority',
      label: t('Priority'),
      icon: <IconFlag size={14} />,
      isMulti: false,
      selectedValues: priorityFilter === ALL_VALUE ? [] : [priorityFilter],
      options: [...ISSUE_PRIORITY_OPTIONS].reverse().map((option) => ({
        value: option.value,
        label: option.label,
        icon: <TaskPriorityGlyph priority={option.value} />,
      })),
      onToggle: toggleSingleValue(priorityFilter, setPriorityFilter),
    },
    {
      key: 'type',
      label: t('Type'),
      icon: <IconCheckbox size={14} />,
      isMulti: false,
      selectedValues: typeFilter === ALL_VALUE ? [] : [typeFilter],
      options: ISSUE_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        icon: <IssueTypeGlyph issueType={option.value} />,
      })),
      onToggle: toggleSingleValue(typeFilter, setTypeFilter),
    },
    ...(board.epics.length > 0
      ? [
          {
            key: 'epic',
            label: t('Epic'),
            icon: <IconStack2 size={14} />,
            isMulti: false,
            selectedValues:
              epicFilter === undefined
                ? []
                : [epicFilter === null ? NO_EPIC_VALUE : epicFilter],
            options: [
              { value: NO_EPIC_VALUE, label: t('No epic') },
              ...board.epics.map((epic) => ({
                value: epic.id,
                label: epic.name ?? t('Untitled epic'),
                icon: (
                  <TaskColorDot
                    color={readTagColor(readEpicColor(epic)).text}
                  />
                ),
              })),
            ],
            onToggle: (value: string) => {
              const nextEpicFilter = value === NO_EPIC_VALUE ? null : value;

              setEpicFilter(
                epicFilter === nextEpicFilter ? undefined : nextEpicFilter,
              );
            },
          },
        ]
      : []),
    ...(view === 'board'
      ? [
          {
            key: 'sprint',
            label: t('Sprint'),
            icon: <IconCalendarRepeat size={14} />,
            isMulti: false,
            selectedValues: [sprintFilter],
            options: [
              ...(activeSprint === undefined
                ? []
                : [{ value: ACTIVE_SPRINT_VALUE, label: t('Active sprint') }]),
              { value: ALL_VALUE, label: t('All sprints') },
              { value: BACKLOG_VALUE, label: t('Backlog') },
              ...board.sprints
                .filter((sprint) => sprint.state !== 'CLOSED')
                .map((sprint) => ({
                  value: sprint.id,
                  label: sprint.name ?? sprint.id,
                })),
            ],
            onToggle: (value: string) => setSprintFilter(value),
          },
        ]
      : []),
  ];

  const toolbarInset = `0 ${pageInset.right}px 0 ${pageInset.left}px`;

  return (
    <TaskBoardFrame>
      <header
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          boxSizing: 'border-box',
          display: 'flex',
          flexShrink: 0,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 8,
          minHeight: 48,
          padding: isMobile
            ? `8px ${pageInset.right}px 8px ${pageInset.left}px`
            : toolbarInset,
        }}
      >
        {/* Three regions on a wide screen: project and view on the left, the
            search in the middle, notifications and New issue on the right. The
            side regions share the leftover width equally, which is what keeps
            the search centred whatever each side holds. */}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flex: '1 1 0',
            gap: 8,
            // Never narrower than what it holds: when the bar is tight the
            // search gives up width first, not the project name.
            minWidth: isMobile ? 0 : 'max-content',
          }}
        >
          <div
            style={{
              display: 'flex',
              flex: '0 1 auto',
              minWidth: 0,
            }}
          >
            <TaskBoardSelect
              ariaLabel={t('Project')}
              variant="ghost"
              width="auto"
              value={projectId ?? board.activeProjectId ?? ''}
              triggerIcon={
                <TaskProjectBadge projectKey={activeProject?.key ?? null} />
              }
              options={board.projects.map((project) => ({
                value: project.id,
                label: project.name ?? project.key ?? project.id,
                icon: (
                  <TaskProjectBadge
                    projectKey={project.key ?? null}
                    size={18}
                  />
                ),
              }))}
              onChange={(value) => {
                setProjectId(value);
                storeValue(PROJECT_STORAGE_KEY, value);
                setSelectedIssueId(null);
                setComposerStatusId(null);
                setComposerSectionKey(null);
                setSelectedAssigneeIds([]);
                setSprintFilter(ACTIVE_SPRINT_VALUE);
                setEpicFilter(undefined);
                setShouldIncludeOlderDone(false);
              }}
            />
          </div>
          <TaskViewSwitch
            value={view}
            onChange={changeView}
            isCompact={isMobile}
          />
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', flex: '0 1 520px', minWidth: 240 }}>
            <TaskIssueSearch
              value={search}
              onChange={setSearch}
              onSelectIssue={selectSearchResult}
              maxWidth={520}
              placeholder={t('Search issues by key or title…')}
            />
          </div>
        )}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flex: isMobile ? '0 0 auto' : '1 1 0',
            gap: 8,
            justifyContent: 'flex-end',
            minWidth: isMobile ? 0 : 'max-content',
          }}
        >
          <TaskDiscussionNotifications />
          {board.canWrite && (
            <TaskButton
              variant="primary"
              size="compact"
              title={t('New issue')}
              isDisabled={view === 'board' && statuses.length === 0}
              onClick={openCreateIssue}
            >
              <IconPlus size={14} />
              {!isMobile && t('New issue')}
            </TaskButton>
          )}
        </div>
        {isMobile && (
          <div style={{ display: 'flex', flexBasis: '100%' }}>
            <TaskIssueSearch
              value={search}
              onChange={setSearch}
              onSelectIssue={selectSearchResult}
              maxWidth="100%"
              size="small"
              placeholder={t('Search issues')}
            />
          </div>
        )}
      </header>

      <div
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          boxSizing: 'border-box',
          display: 'flex',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: 6,
          minHeight: 40,
          padding: `6px ${pageInset.right}px 6px ${pageInset.left}px`,
        }}
      >
        {board.activeProjectId !== null && (
          <TaskToolbarToggle
            label={isEpicPanelOpen ? t('Hide epics') : t('Show epics')}
            isActive={isEpicPanelOpen}
            onClick={toggleEpicPanel}
          >
            <IconLayoutSidebar size={16} />
          </TaskToolbarToggle>
        )}
        <TaskFilterMenu fields={filterFields} isCompact={isMobile} />
        {selectedAssigneeIds.length > 0 && (
          <TaskFilterChip
            label={t('Assignee')}
            value={
              selectedAssigneeNames.length > 2
                ? `${selectedAssigneeNames.slice(0, 2).join(', ')} +${selectedAssigneeNames.length - 2}`
                : selectedAssigneeNames.join(', ')
            }
            onRemove={() => setSelectedAssigneeIds([])}
          />
        )}
        {selectedPriorityOption !== undefined && (
          <TaskFilterChip
            label={t('Priority')}
            value={selectedPriorityOption.label}
            icon={
              <TaskPriorityGlyph
                priority={selectedPriorityOption.value}
                size={12}
              />
            }
            onRemove={() => setPriorityFilter(ALL_VALUE)}
          />
        )}
        {selectedTypeOption !== undefined && (
          <TaskFilterChip
            label={t('Type')}
            value={selectedTypeOption.label}
            icon={<IssueTypeGlyph issueType={selectedTypeOption.value} />}
            onRemove={() => setTypeFilter(ALL_VALUE)}
          />
        )}
        {selectedEpicLabel !== null && (
          <TaskFilterChip
            label={t('Epic')}
            value={selectedEpicLabel}
            onRemove={() => setEpicFilter(undefined)}
          />
        )}
        {view === 'board' && sprintFilter !== ACTIVE_SPRINT_VALUE && (
          <TaskFilterChip
            label={t('Sprint')}
            value={readSprintFilterLabel()}
            onRemove={() => setSprintFilter(ACTIVE_SPRINT_VALUE)}
          />
        )}
        {board.currentWorkspaceMemberId !== null && (
          <TaskFilterToggle
            label={t('Only mine')}
            isActive={isOnlyMine}
            onToggle={toggleOnlyMine}
          />
        )}
        {!isMobile && (
          <TaskBoardAssigneeFilter
            options={assigneeOptions}
            selectedIds={selectedAssigneeIds}
            onToggle={toggleAssignee}
          />
        )}
        {(isFiltered || isSorted) && (
          <TaskButton variant="ghost" size="compact" onClick={resetFilters}>
            {t('Clear')}
          </TaskButton>
        )}
        <span style={{ flex: 1 }} />
        {view === 'board' && !isMobile && !isShowingActiveSprint && (
          <span
            title={`${progress.percent}%`}
            style={{
              color: TASK_TOKENS.textTertiary,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {t('{done} of {total} done', {
              done: progress.doneCount,
              total: progress.totalCount,
            })}
          </span>
        )}
        {view === 'board' && (
          <TaskBoardSortMenu
            isMobile={isMobile}
            sort={boardSort}
            canAddRule={canAddSortRule}
            onAddRule={() => void addSortRule()}
            onChangeRuleField={(index, field) =>
              void changeSortRuleField(index, field)
            }
            onToggleRuleDirection={(index) =>
              void toggleSortRuleDirection(index)
            }
            onMoveRuleUp={(index) => void moveSortRuleUp(index)}
            onRemoveRule={(index) => void removeSortRule(index)}
            onClearSort={() => void clearSort()}
          />
        )}
        {view === 'board' && !isMobile && board.canManageViews && (
          <TaskFieldsMenu
            label={t('Card fields')}
            buttonLabel={t('Display')}
            fields={ISSUE_CARD_FIELDS}
            hiddenFields={hiddenCardFields}
            onHiddenFieldsChange={saveHiddenCardFields}
          />
        )}
      </div>

      {view === 'board' &&
        sprintFilter === ACTIVE_SPRINT_VALUE &&
        (activeSprint === undefined ? (
          <TaskNoActiveSprintBanner
            inset={pageInset}
            onOpenBacklog={() => changeView('backlog')}
          />
        ) : (
          <TaskSprintHeader
            inset={pageInset}
            sprint={activeSprint}
            canWrite={board.canWrite}
            isCompact={isMobile}
            progress={progress}
            onComplete={() => setCompletingSprint(activeSprint)}
            onEdit={() => setSprintDialogSprint(activeSprint)}
            onViewAllIssues={() => setSprintFilter(ALL_VALUE)}
          />
        ))}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {isEpicPanelOpen && board.activeProjectId !== null && (
          <TaskEpicPanel
            isFullScreen={isEpicPanelFullScreen}
            inset={pageInset}
            projectId={board.activeProjectId}
            epics={board.epics}
            epicFilter={epicFilter}
            onEpicFilterChange={(nextEpicFilter) => {
              setEpicFilter(nextEpicFilter);

              // Full screen, the panel hides what the filter changes.
              if (isEpicPanelFullScreen) {
                toggleEpicPanel();
              }
            }}
            canWrite={board.canWrite}
            canSoftDelete={board.canSoftDelete}
            refreshKey={refreshKey}
            refreshBoard={refreshBoard}
            draggingIssueId={draggingIssueId}
            onAssignIssueToEpic={(issueId, epicId) =>
              void assignIssueToEpic(issueId, epicId)
            }
            onClose={toggleEpicPanel}
          />
        )}
        <div
          style={{
            display: isEpicPanelFullScreen ? 'none' : 'flex',
            flex: 1,
            flexDirection: 'column',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {view === 'board' ? (
            <TaskBoardView
              board={board}
              setBoard={setBoard}
              boardQueryBody={columnQueryBody}
              boardGenerationRef={boardGenerationRef}
              loadingColumnKeys={loadingColumnKeys}
              setLoadingColumnKeys={setLoadingColumnKeys}
              statuses={statuses}
              doneStatusIds={doneStatusIds}
              membersById={membersById}
              epicsById={epicsById}
              sprintNamesById={sprintNamesById}
              shouldShowSprintChip={!isShowingSingleSprint}
              hiddenCardFields={hiddenCardFields}
              selectedIssueId={selectedIssueId}
              setSelectedIssueId={setSelectedIssueId}
              refreshBoard={refreshBoard}
              shouldIncludeOlderDone={shouldIncludeOlderDone}
              setShouldIncludeOlderDone={setShouldIncludeOlderDone}
              composerStatusId={composerStatusId}
              setComposerStatusId={setComposerStatusId}
              newIssueSprintId={newIssueSprintId}
              newIssueEpicId={newIssueEpicId}
              draggingIssueId={draggingIssueId}
              setDraggingIssueId={setDraggingIssueId}
              loadError={loadError}
              boardPath={boardPath}
              inset={pageInset}
            />
          ) : (
            board.activeProjectId !== null && (
              <TaskBacklogView
                projectId={board.activeProjectId}
                projectKey={activeProject?.key ?? null}
                allSprints={board.sprints}
                statuses={statuses}
                doneStatusIds={doneStatusIds}
                epicsById={epicsById}
                queryBody={sharedQueryBody}
                newIssueEpicId={newIssueEpicId}
                canWrite={board.canWrite}
                canSoftDelete={board.canSoftDelete}
                refreshKey={refreshKey}
                refreshBoard={refreshBoard}
                selectedIssueId={selectedIssueId}
                setSelectedIssueId={setSelectedIssueId}
                draggingIssueId={draggingIssueId}
                setDraggingIssueId={setDraggingIssueId}
                composerSectionKey={composerSectionKey}
                setComposerSectionKey={setComposerSectionKey}
                boardPath={boardPath}
                isMobile={isMobile}
                inset={pageInset}
                assignableMembers={board.assignableMembers}
              />
            )
          )}
        </div>
      </div>

      {sprintDialogSprint !== null && (
        <twenty-overlay>
          <TaskSprintDialog
            mode="edit"
            sprint={sprintDialogSprint}
            issueCount={progress.totalCount}
            onClose={() => setSprintDialogSprint(null)}
            onSaved={closeSprintDialogsAndRefresh}
          />
        </twenty-overlay>
      )}

      {completingSprint !== null && (
        <twenty-overlay>
          <TaskCompleteSprintDialog
            sprint={completingSprint}
            futureSprints={board.sprints.filter(
              (sprint) =>
                sprint.id !== completingSprint.id &&
                sprint.state !== 'ACTIVE' &&
                sprint.state !== 'CLOSED',
            )}
            onClose={() => setCompletingSprint(null)}
            onCompleted={closeSprintDialogsAndRefresh}
          />
        </twenty-overlay>
      )}
    </TaskBoardFrame>
  );
};

// The page fills its widget's viewport slot: header pinned, columns scrolling
// inside it. A standalone page has no record, so there is no useRecordId here
// — the selected issue is plain component state.
const TaskBoardFrame = ({ children }: { children: React.ReactNode }) => (
  <section
    style={{
      background: TASK_TOKENS.background,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: TASK_TOKENS.fontFamily,
      height: '100%',
      minHeight: 0,
      width: '100%',
    }}
  >
    {children}
  </section>
);

export default defineFrontComponent({
  universalIdentifier: TASK_BOARD_FRONT_COMPONENT_UID,
  name: 'task-board',
  description:
    'Jira-style planning page: backlog with sprints, the active sprint board, an epic panel and the issue detail as a drawer.',
  component: TaskBoard,
});
