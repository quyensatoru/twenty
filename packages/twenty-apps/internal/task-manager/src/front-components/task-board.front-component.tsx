import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  enqueueSnackbar,
  t,
  useFrontComponentExecutionContext,
} from 'twenty-sdk/front-component';
import { IconFilterOff, IconPlus, IconStack2 } from 'twenty-ui/icon';

import { BOARD_ACTIVE_SPRINT } from '../constants/board-active-sprint';
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
import { readIssueViewSettings } from '../utils/read-issue-view-settings.util';
import {
  TaskBoardAssigneeFilter,
  type TaskBoardAssigneeOption,
  UNASSIGNED_ASSIGNEE_VALUE,
} from './components/task-board-assignee-filter';
import { TaskBacklogView } from './components/task-backlog-view';
import { TaskBoardSelect } from './components/task-board-select';
import { TaskBoardSkeleton } from './components/task-board-skeleton';
import { NO_STATUS_VALUE, TaskBoardView } from './components/task-board-view';
import { TaskButton } from './components/task-button';
import { TaskCompleteSprintDialog } from './components/task-complete-sprint-dialog';
import { type EpicFilter, TaskEpicPanel } from './components/task-epic-panel';
import { TaskFieldsMenu } from './components/task-fields-menu';
import { TaskFilterToggle } from './components/task-filter-toggle';
import { TaskIssueSearch } from './components/task-issue-search';
import { TaskMessage } from './components/task-message';
import { TaskSprintDialog } from './components/task-sprint-dialog';
import {
  TaskNoActiveSprintBanner,
  TaskSprintHeader,
} from './components/task-sprint-header';
import { readTagColor, TASK_TOKENS } from './components/task-tokens';
import { TaskViewSwitch } from './components/task-view-switch';
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

  // The filters the two views share. The backlog has no sprint filter: its
  // sections are the sprints.
  const sharedQueryBody = useMemo(
    () => ({
      ...(epicFilter === undefined ? {} : { epicId: epicFilter }),
      assigneeIds: assigneeFilterIds,
      issueType: issueTypeFilter,
    }),
    [epicFilter, assigneeFilterIds, issueTypeFilter],
  );

  const boardQueryBody = useMemo(
    () => ({
      ...sharedQueryBody,
      ...(sprintId === undefined ? {} : { sprintId }),
      includeOlderDone: shouldIncludeOlderDone,
    }),
    [sharedQueryBody, sprintId, shouldIncludeOlderDone],
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
    typeFilter !== ALL_VALUE;

  const resetFilters = () => {
    setSearch('');
    setSprintFilter(ACTIVE_SPRINT_VALUE);
    setEpicFilter(undefined);
    setSelectedAssigneeIds([]);
    setIsOnlyMine(false);
    setTypeFilter(ALL_VALUE);
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

    const parentId = board?.issues.find((issue) => issue.id === issueId)
      ?.parentId;

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

  return (
    <TaskBoardFrame>
      <div
        style={{
          background: TASK_TOKENS.background,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          gap: 10,
          padding: `12px ${pageInset.right}px 12px ${pageInset.left}px`,
        }}
      >
        <div
          style={
            isMobile
              ? { display: 'flex', flexDirection: 'column', gap: 8 }
              : {
                  alignItems: 'center',
                  columnGap: 16,
                  display: 'grid',
                  // Equal outer tracks keep the search centred on the board
                  // itself, whatever the pickers on the left and the button
                  // on the right measure; max-content stops either side
                  // from being squeezed.
                  gridTemplateColumns:
                    'minmax(max-content, 1fr) minmax(240px, 560px) minmax(max-content, 1fr)',
                }
          }
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
            {/* On a phone the picker takes what the switch and the create
                button leave, and no more: a 100% child would push them off
                the screen. */}
            <div
              style={{
                display: 'flex',
                flex: isMobile ? '1 1 0' : '0 0 auto',
                minWidth: 0,
              }}
            >
              <TaskBoardSelect
                ariaLabel={t('Project')}
                width={isMobile ? '100%' : 190}
                value={projectId ?? board.activeProjectId ?? ''}
                options={board.projects.map((project) => ({
                  value: project.id,
                  label:
                    typeof project.key === 'string' && project.key !== ''
                      ? `${project.name ?? project.id} (${project.key})`
                      : (project.name ?? project.id),
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
            {isMobile && board.canWrite && (
              <TaskButton
                variant="primary"
                title={t('Create issue')}
                isDisabled={view === 'board' && statuses.length === 0}
                onClick={openCreateIssue}
              >
                <IconPlus size={14} />
              </TaskButton>
            )}
          </div>
          <TaskIssueSearch
            value={search}
            onChange={setSearch}
            onSelectIssue={selectSearchResult}
            isShortcutEnabled={selectedIssueId === null}
            maxWidth={isMobile ? '100%' : 560}
            size={isMobile ? 'medium' : 'large'}
            placeholder={t('Search issues by key or title…')}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {!isMobile && board.canWrite && (
              <TaskButton
                variant="primary"
                isDisabled={view === 'board' && statuses.length === 0}
                onClick={openCreateIssue}
              >
                <IconPlus size={14} />
                {t('Create issue')}
              </TaskButton>
            )}
          </div>
        </div>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            minHeight: 32,
          }}
        >
          <TaskButton
            variant={isEpicPanelOpen ? 'primary' : 'secondary'}
            onClick={toggleEpicPanel}
          >
            <IconStack2 size={14} />
            {t('Epics')}
          </TaskButton>
          <TaskBoardAssigneeFilter
            options={assigneeOptions}
            selectedIds={selectedAssigneeIds}
            onToggle={toggleAssignee}
          />
          {board.currentWorkspaceMemberId !== null && (
            <TaskFilterToggle
              label={t('Only my issues')}
              isActive={isOnlyMine}
              onToggle={toggleOnlyMine}
            />
          )}
          <TaskBoardSelect
            ariaLabel={t('Type')}
            width={130}
            value={typeFilter}
            options={[
              { value: ALL_VALUE, label: t('All types') },
              ...ISSUE_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
                color: option.color,
              })),
            ]}
            onChange={(value) => setTypeFilter(value)}
          />
          {view === 'board' && !isShowingActiveSprint && (
            <TaskBoardSelect
              ariaLabel={t('Sprint')}
              width={170}
              value={
                sprintFilter === ACTIVE_SPRINT_VALUE &&
                activeSprint === undefined
                  ? ALL_VALUE
                  : sprintFilter
              }
              options={[
                ...(activeSprint === undefined
                  ? []
                  : [
                      { value: ACTIVE_SPRINT_VALUE, label: t('Active sprint') },
                    ]),
                { value: ALL_VALUE, label: t('All sprints') },
                { value: BACKLOG_VALUE, label: t('Backlog') },
                ...board.sprints.map((sprint) => ({
                  value: sprint.id,
                  label:
                    sprint.state === 'ACTIVE'
                      ? `${sprint.name ?? sprint.id} · ${t('Active')}`
                      : (sprint.name ?? sprint.id),
                })),
              ]}
              onChange={(value) => setSprintFilter(value)}
            />
          )}
          {isFiltered && (
            <TaskButton variant="ghost" onClick={resetFilters}>
              <IconFilterOff size={14} />
              {t('Clear filters')}
            </TaskButton>
          )}
          <span style={{ flex: 1 }} />
          {view === 'board' && !isMobile && (
            <span
              style={{
                alignItems: 'center',
                color: TASK_TOKENS.textTertiary,
                display: 'inline-flex',
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 12,
                gap: 10,
                whiteSpace: 'nowrap',
              }}
            >
              <span>
                {progress.totalCount === 1
                  ? `1 ${t('issue')}`
                  : `${progress.totalCount} ${t('issues')}`}
              </span>
              <span
                title={`${progress.percent}%`}
                style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}
              >
                <span style={{ color: TASK_TOKENS.textSecondary }}>
                  {`${progress.doneCount} / ${progress.totalCount} ${t('done')}`}
                </span>
                <span
                  style={{
                    background: TASK_TOKENS.backgroundTertiary,
                    borderRadius: 4,
                    display: 'inline-flex',
                    height: 6,
                    overflow: 'hidden',
                    width: 120,
                  }}
                >
                  <span
                    style={{
                      background: readTagColor('green').text,
                      display: 'block',
                      height: '100%',
                      width: `${progress.percent}%`,
                    }}
                  />
                </span>
                <span style={{ fontWeight: 600, minWidth: 32 }}>
                  {`${progress.percent}%`}
                </span>
              </span>
            </span>
          )}
          {view === 'board' && !isMobile && board.canManageViews && (
            <TaskFieldsMenu
              label={t('Card fields')}
              fields={ISSUE_CARD_FIELDS}
              hiddenFields={hiddenCardFields}
              onHiddenFieldsChange={saveHiddenCardFields}
            />
          )}
        </div>
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
              boardQueryBody={boardQueryBody}
              boardGenerationRef={boardGenerationRef}
              loadingColumnKeys={loadingColumnKeys}
              setLoadingColumnKeys={setLoadingColumnKeys}
              statuses={statuses}
              doneStatusIds={doneStatusIds}
              membersById={membersById}
              epicsById={epicsById}
              sprintNamesById={sprintNamesById}
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
