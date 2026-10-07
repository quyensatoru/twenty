import { useCallback, useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  enqueueSnackbar,
  t,
  useFrontComponentExecutionContext,
} from 'twenty-sdk/front-component';
import {
  IconCheck,
  IconFilterOff,
  IconGripVertical,
  IconPlus,
  IconX,
} from 'twenty-ui/icon';

import { BOARD_DONE_ISSUE_VISIBLE_DAYS } from '../constants/board-done-issue-visible-days';
import { ISSUE_TYPE_OPTIONS } from '../constants/issue-type-options';
import {
  CREATE_ISSUE_ROUTE_PATH,
  DELETE_ISSUE_ROUTE_PATH,
  REORDER_ISSUE_STATUSES_ROUTE_PATH,
  TASK_BOARD_ROUTE_PATH,
  UPDATE_ISSUE_ROUTE_PATH,
} from '../constants/route-paths';
import { TASK_BOARD_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import {
  type BoardData,
  type BoardIssue,
  type BoardMember,
} from '../types/task-board';
import {
  TaskBoardAssigneeFilter,
  type TaskBoardAssigneeOption,
  UNASSIGNED_ASSIGNEE_VALUE,
} from './components/task-board-assignee-filter';
import { TaskBoardCard } from './components/task-board-card';
import { TaskBoardDetail } from './components/task-board-detail';
import { TaskBoardSelect } from './components/task-board-select';
import { TaskBoardSkeleton } from './components/task-board-skeleton';
import { TaskButton } from './components/task-button';
import { TaskFilterToggle } from './components/task-filter-toggle';
import { TaskIconButton } from './components/task-icon-button';
import { TaskIssueSearch } from './components/task-issue-search';
import { TaskMessage } from './components/task-message';
import { TaskStatusLine } from './components/task-status-line';
import { TaskTextInput } from './components/task-text-input';
import {
  readTagColor,
  TASK_CIRCLE_STYLE,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './components/task-tokens';
import {
  clampColumnWidth,
  COLUMN_DEFAULT_WIDTH,
  parseColumnWidth,
} from './utils/column-widths.util';
import { moveIdOnto } from './utils/move-id-onto.util';
import { parseBoardIssueAnchor } from './utils/parse-board-anchor.util';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';
import { readMemberName } from './utils/read-member-name.util';

const ALL_VALUE = 'ALL';
const BACKLOG_VALUE = 'BACKLOG';
const NO_STATUS_VALUE = 'NO_STATUS';
const COLUMN_WIDTH_STORAGE_KEY = 'task-board.column-width';
const PROJECT_STORAGE_KEY = 'task-board.project-id';
// Cards drawn per column before a "show more": every card is dozens of
// elements the sandbox has to ship to the host, and a column of hundreds is
// what made a large board take seconds to appear.
const CARDS_PER_COLUMN_PAGE = 50;
// How close to a column's bottom the next page is drawn: a little ahead, so
// the reader does not hit the end before the cards are there.
const LAZY_LOAD_THRESHOLD_PX = 400;

// The sandbox's localStorage is seeded from the host before the first render,
// so this reads synchronously. Guarded anyway: a store that is missing or
// full must never take the board down with it.
const readStoredColumnWidth = (): number => {
  try {
    return parseColumnWidth(localStorage.getItem(COLUMN_WIDTH_STORAGE_KEY));
  } catch {
    return COLUMN_DEFAULT_WIDTH;
  }
};

const storeColumnWidth = (columnWidth: number) => {
  try {
    localStorage.setItem(COLUMN_WIDTH_STORAGE_KEY, String(columnWidth));
  } catch {
    // The width is a convenience: losing it only costs the reader a drag.
  }
};

// The project the reader last looked at, so the board does not open on the
// alphabetically first project — in production also the heaviest one. The
// route falls back to a visible project if this one is no longer visible.
const readStoredProjectId = (): string | null => {
  try {
    const projectId = localStorage.getItem(PROJECT_STORAGE_KEY);

    return projectId === null || projectId === '' ? null : projectId;
  } catch {
    return null;
  }
};

const storeProjectId = (projectId: string) => {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, projectId);
  } catch {
    // A convenience only: the board still opens, on the default project.
  }
};

// The column whose edge is held, and where it sits: every column takes the
// same width, so the held edge moves (index + 1) times the width change.
type ColumnResize = {
  statusId: string;
  columnIndex: number;
  startX: number;
  startWidth: number;
};

// The Jira-style board: one column per project status, cards filtered by
// sprint, search, owner and type, drag-and-drop between columns, inline create
// per column, and the issue detail as a drawer over the board.
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
  const boardPath = useFrontComponentExecutionContext((context) => {
    const pathname = (context as { locationPathname?: string })
      .locationPathname;

    return typeof pathname === 'string' && pathname !== '' ? pathname : null;
  });
  const [board, setBoard] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(
    readStoredProjectId,
  );
  const [shouldIncludeOlderDone, setShouldIncludeOlderDone] = useState(false);
  const [shownCardCountByStatus, setShownCardCountByStatus] = useState<
    Record<string, number>
  >({});
  const [sprintFilter, setSprintFilter] = useState<string>(ALL_VALUE);
  const [search, setSearch] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
    [],
  );
  const [isOnlyMine, setIsOnlyMine] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>(ALL_VALUE);
  // A board deep link decides the opening modal, so a pasted link lands on
  // the issue it is about. It is the INITIAL value only: the reader keeps
  // whatever they open afterwards.
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(
    parseBoardIssueAnchor(locationHash),
  );
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null);
  // A column being dragged by its header, and the column it would land on.
  // Kept apart from the card drag: both use the same drop zones.
  const [draggingStatusId, setDraggingStatusId] = useState<string | null>(
    null,
  );
  const [statusDropTargetId, setStatusDropTargetId] = useState<string | null>(
    null,
  );
  const [hoveredHeaderId, setHoveredHeaderId] = useState<string | null>(null);
  const [columnWidth, setColumnWidth] = useState<number>(
    readStoredColumnWidth,
  );
  const [columnResize, setColumnResize] = useState<ColumnResize | null>(null);
  const [hoveredResizeId, setHoveredResizeId] = useState<string | null>(null);
  const [dropTargetStatusId, setDropTargetStatusId] = useState<string | null>(
    null,
  );
  const [composerStatusId, setComposerStatusId] = useState<string | null>(null);
  const [composerTitle, setComposerTitle] = useState('');
  const [composerType, setComposerType] = useState<string>('TASK');
  // Bumped after each create: the title field only takes an outside reset on
  // remount (see useStableFieldValue), and the composer stays open for the
  // next title the way Jira's inline create does.
  const [composerKey, setComposerKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [hoveredCreateColumnId, setHoveredCreateColumnId] = useState<
    string | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const sprintId =
    sprintFilter === ALL_VALUE
      ? undefined
      : sprintFilter === BACKLOG_VALUE
        ? null
        : sprintFilter;

  const loadBoard = useCallback(async () => {
    try {
      const result = await postAppRoute<
        BoardData & { success: true }
      >(
        TASK_BOARD_ROUTE_PATH,
        {
          ...(projectId === null
            ? {}
            : { projectId, ...(sprintId === undefined ? {} : { sprintId }) }),
          includeOlderDone: shouldIncludeOlderDone,
        },
      );

      setBoard({
        projects: result.projects ?? [],
        activeProjectId: result.activeProjectId ?? null,
        issueStatuses: result.issueStatuses ?? [],
        sprints: result.sprints ?? [],
        epics: result.epics ?? [],
        issues: result.issues ?? [],
        members: result.members ?? [],
        currentWorkspaceMemberId: result.currentWorkspaceMemberId ?? null,
        hiddenDoneIssueCount: result.hiddenDoneIssueCount ?? 0,
      });
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  }, [projectId, sprintId, shouldIncludeOlderDone]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadBoard();
      setIsLoading(false);
    };

    void load();
  }, [loadBoard, refreshKey]);

  const refreshBoard = () => setRefreshKey((key) => key + 1);

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
    sprintFilter !== ALL_VALUE ||
    selectedAssigneeIds.length > 0 ||
    isOnlyMine ||
    typeFilter !== ALL_VALUE;

  const resetFilters = () => {
    setSearch('');
    setSprintFilter(ALL_VALUE);
    setSelectedAssigneeIds([]);
    setIsOnlyMine(false);
    setTypeFilter(ALL_VALUE);
  };

  const toggleAssignee = (assigneeId: string) =>
    setSelectedAssigneeIds((current) =>
      current.includes(assigneeId)
        ? current.filter((id) => id !== assigneeId)
        : [...current, assigneeId],
    );

  const membersById = useMemo(
    () =>
      new Map<string, BoardMember>(
        (board?.members ?? []).map((member) => [member.id, member]),
      ),
    [board],
  );

  const epicNamesById = useMemo(
    () =>
      new Map(
        (board?.epics ?? []).map((epic) => [epic.id, epic.name ?? epic.id]),
      ),
    [board],
  );

  // Faces for the quick filter: whoever owns a card on this board, read from
  // every loaded issue rather than the filtered ones, so a face never vanishes
  // the moment it is picked.
  const assigneeOptions = useMemo(() => {
    const issues = board?.issues ?? [];
    const assigneeIds = [
      ...new Set(
        issues
          .map((issue) => issue.assigneeId)
          .filter(
            (assigneeId): assigneeId is string =>
              typeof assigneeId === 'string' && assigneeId !== '',
          ),
      ),
    ];
    const options: TaskBoardAssigneeOption[] = assigneeIds
      .map((assigneeId) => ({
        id: assigneeId,
        name: readMemberName(membersById, assigneeId, t('Unknown')),
        avatarUrl: membersById.get(assigneeId)?.avatarUrl,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    if (issues.some((issue) => typeof issue.assigneeId !== 'string')) {
      options.push({ id: UNASSIGNED_ASSIGNEE_VALUE, name: t('Unassigned') });
    }

    return options;
  }, [board, membersById]);

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

  const visibleIssues = useMemo(() => {
    // The header search never narrows the columns: it only feeds the global
    // results popover (jump-to-issue), so typing never rearranges the board
    // under the pointer. Column filtering is the selects' job.
    return (board?.issues ?? []).filter((issue) => {
      if (typeFilter !== ALL_VALUE && issue.issueType !== typeFilter) {
        return false;
      }

      if (
        isOnlyMine &&
        (board?.currentWorkspaceMemberId === null ||
          issue.assigneeId !== board?.currentWorkspaceMemberId)
      ) {
        return false;
      }

      if (selectedAssigneeIds.length > 0) {
        const assigneeKey =
          typeof issue.assigneeId === 'string'
            ? issue.assigneeId
            : UNASSIGNED_ASSIGNEE_VALUE;

        if (!selectedAssigneeIds.includes(assigneeKey)) {
          return false;
        }
      }

      return true;
    });
  }, [board, isOnlyMine, selectedAssigneeIds, typeFilter]);

  const issuesByStatus = useMemo(() => {
    const grouped = new Map<string, BoardIssue[]>();

    for (const issue of visibleIssues) {
      const key =
        typeof issue.statusId === 'string' ? issue.statusId : NO_STATUS_VALUE;

      grouped.set(key, [...(grouped.get(key) ?? []), issue]);
    }

    return grouped;
  }, [visibleIssues]);

  // Flat card order across columns, for the drawer's previous / next stepping.
  const navIssueIds = useMemo(() => {
    const ordered: string[] = [];

    for (const status of statuses) {
      for (const issue of issuesByStatus.get(status.id) ?? []) {
        ordered.push(issue.id);
      }
    }

    for (const issue of issuesByStatus.get(NO_STATUS_VALUE) ?? []) {
      ordered.push(issue.id);
    }

    return ordered;
  }, [statuses, issuesByStatus]);

  const doneCount = visibleIssues.filter((issue) =>
    doneStatusIds.has(issue.statusId ?? ''),
  ).length;
  const progressPercent =
    visibleIssues.length === 0
      ? 0
      : Math.round((doneCount / visibleIssues.length) * 100);

  // Optimistic like the record page's status picker: the card sits in its new
  // column before the server confirms it, and a failed write puts everything
  // back with a toast rather than leaving the board lying.
  const moveIssue = async (issueId: string, statusId: string | null) => {
    if (board === null) {
      return;
    }

    const previousIssues = board.issues;
    const targetStatusId =
      statusId === NO_STATUS_VALUE ? null : (statusId as string);

    setBoard({
      ...board,
      issues: board.issues.map((issue) =>
        issue.id === issueId
          ? { ...issue, statusId: targetStatusId }
          : issue,
      ),
    });
    setDropTargetStatusId(null);
    setDraggingIssueId(null);

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { statusId: targetStatusId },
      });
    } catch (error) {
      setBoard({ ...board, issues: previousIssues });
      const message = readErrorText(error);
      void enqueueSnackbar({ message, variant: 'error' });
    }
  };

  // Optimistic like the move above: the card leaves at once, and a failed
  // write puts everything back. An open modal of the same issue closes with
  // it — its record is gone — and stays closed when the write fails, while
  // the card comes back.
  const deleteIssue = async (issueId: string) => {
    if (board === null) {
      return;
    }

    const previousIssues = board.issues;

    setBoard({
      ...board,
      issues: board.issues.filter((issue) => issue.id !== issueId),
    });

    if (selectedIssueId === issueId) {
      setSelectedIssueId(null);
    }

    try {
      await postAppRoute(DELETE_ISSUE_ROUTE_PATH, { issueId });
      void enqueueSnackbar({
        message: t('Issue deleted.'),
        variant: 'success',
      });
    } catch (error) {
      setBoard({ ...board, issues: previousIssues });
      void enqueueSnackbar({
        message: readErrorText(error),
        variant: 'error',
      });
    }
  };

  const createIssue = async () => {
    const title = composerTitle.trim();
    const activeProjectId = board?.activeProjectId ?? null;

    if (title === '' || activeProjectId === null || composerStatusId === null) {
      return;
    }

    setIsCreating(true);

    try {
      await postAppRoute(CREATE_ISSUE_ROUTE_PATH, {
        projectId: activeProjectId,
        data: {
          title,
          issueType: composerType,
          statusId:
            composerStatusId === NO_STATUS_VALUE ? null : composerStatusId,
        },
      });
      setComposerTitle('');
      setComposerKey((key) => key + 1);
      refreshBoard();
      void enqueueSnackbar({ message: t('Issue created.'), variant: 'success' });
    } catch (error) {
      void enqueueSnackbar({
        message: readErrorText(error),
        variant: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Optimistic like moveIssue: the columns swap at once, and a refused write
  // (no grant, or statuses changed elsewhere) puts the old order back.
  const reorderStatuses = async (movedId: string, targetId: string) => {
    setDraggingStatusId(null);
    setStatusDropTargetId(null);

    const activeProjectId = board?.activeProjectId ?? null;

    if (board === null || activeProjectId === null) {
      return;
    }

    const orderedIds = statuses.map((status) => status.id);
    const nextIds = moveIdOnto(orderedIds, movedId, targetId);

    if (nextIds === orderedIds) {
      return;
    }

    const previousStatuses = board.issueStatuses;

    setBoard({
      ...board,
      issueStatuses: board.issueStatuses.map((status) => ({
        ...status,
        position: nextIds.indexOf(status.id),
      })),
    });

    try {
      await postAppRoute(REORDER_ISSUE_STATUSES_ROUTE_PATH, {
        projectId: activeProjectId,
        issueStatusIds: nextIds,
      });
    } catch (error) {
      setBoard((current) =>
        current === null
          ? current
          : { ...current, issueStatuses: previousStatuses },
      );
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    }
  };

  // Keyed to the count the scroll saw, so a burst of scroll events while the
  // next page renders adds one page, not one per event.
  const showMoreCards = (statusId: string, fromCount: number) =>
    setShownCardCountByStatus((current) =>
      (current[statusId] ?? CARDS_PER_COLUMN_PAGE) === fromCount
        ? { ...current, [statusId]: fromCount + CARDS_PER_COLUMN_PAGE }
        : current,
    );

  // No window listener reaches the sandbox, so a resize follows the pointer
  // through the columns strip itself, and ends when the button comes up
  // there or the pointer leaves the strip. Dividing by the columns up to the
  // held one keeps that edge under the pointer while all of them grow.
  const readResizedWidth = (resize: ColumnResize, clientX: number) =>
    clampColumnWidth(
      resize.startWidth + (clientX - resize.startX) / (resize.columnIndex + 1),
    );

  const updateColumnResize = (clientX: number) => {
    if (columnResize === null) {
      return;
    }

    setColumnWidth(readResizedWidth(columnResize, clientX));
  };

  const endColumnResize = (clientX: number) => {
    if (columnResize === null) {
      return;
    }

    const width = readResizedWidth(columnResize, clientX);

    setColumnResize(null);
    setColumnWidth(width);
    storeColumnWidth(width);
  };

  const resetColumnWidth = () => {
    setColumnWidth(COLUMN_DEFAULT_WIDTH);
    storeColumnWidth(COLUMN_DEFAULT_WIDTH);
  };

  const closeComposer = () => {
    setComposerStatusId(null);
    setComposerTitle('');
  };

  const statusOptions = statuses.map((status) => ({
    value: status.id,
    label: status.name ?? status.id,
    color: status.color,
  }));

  if (isLoading && board === null) {
    return (
      <TaskBoardFrame>
        <TaskBoardSkeleton />
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
          text={t('No project is available to you yet. Ask for access to a Shopify app first.')}
        />
      </TaskBoardFrame>
    );
  }

  const columns =
    statuses.length === 0
      ? [{ id: NO_STATUS_VALUE, name: t('Issues'), color: 'gray' as string | null }]
      : [
          ...statuses.map((status) => ({
            id: status.id,
            name: status.name ?? status.id,
            color: status.color ?? null,
          })),
          ...((issuesByStatus.get(NO_STATUS_VALUE) ?? []).length > 0
            ? [{ id: NO_STATUS_VALUE, name: t('No status'), color: 'gray' as string | null }]
            : []),
        ];

  // One toggle for the whole window, on the first done column: the count
  // covers every done status, so a second copy would only repeat it.
  const olderDoneToggleColumnId =
    shouldIncludeOlderDone || board.hiddenDoneIssueCount > 0
      ? (columns.find((column) => doneStatusIds.has(column.id))?.id ?? null)
      : null;

  return (
    <TaskBoardFrame>
      <div
        style={{
          background: TASK_TOKENS.background,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          gap: 10,
          padding: '12px 20px 12px 20px',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            columnGap: 16,
            display: 'grid',
            // Equal outer tracks keep the search centred on the board itself,
            // whatever the pickers on the left and the button on the right
            // measure; max-content stops either side from being squeezed.
            gridTemplateColumns:
              'minmax(max-content, 1fr) minmax(240px, 560px) minmax(max-content, 1fr)',
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
            <TaskBoardSelect
              ariaLabel={t('Project')}
              width={190}
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
                storeProjectId(value);
                setSelectedIssueId(null);
                setComposerStatusId(null);
                setSelectedAssigneeIds([]);
                setShouldIncludeOlderDone(false);
                setShownCardCountByStatus({});
              }}
            />
            <TaskBoardSelect
              ariaLabel={t('Sprint')}
              width={150}
              value={sprintFilter}
              options={[
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
          </div>
          <TaskIssueSearch
            value={search}
            onChange={setSearch}
            onSelectIssue={selectSearchResult}
            isShortcutEnabled={selectedIssueId === null}
            maxWidth={560}
            size="large"
            placeholder={t('Search issues by key or title…')}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TaskButton
              variant="primary"
              isDisabled={statuses.length === 0}
              onClick={() => {
                setComposerStatusId(statuses[0]?.id ?? NO_STATUS_VALUE);
                setComposerTitle('');
              }}
            >
              <IconPlus size={14} />
              {t('Create issue')}
            </TaskButton>
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
          <TaskBoardAssigneeFilter
            options={assigneeOptions}
            selectedIds={selectedAssigneeIds}
            onToggle={toggleAssignee}
          />
          {board.currentWorkspaceMemberId !== null && (
            <TaskFilterToggle
              label={t('Only my issues')}
              isActive={isOnlyMine}
              onToggle={() => setIsOnlyMine(!isOnlyMine)}
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
          {isFiltered && (
            <TaskButton variant="ghost" onClick={resetFilters}>
              <IconFilterOff size={14} />
              {t('Clear filters')}
            </TaskButton>
          )}
          <span style={{ flex: 1 }} />
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
              {visibleIssues.length === 1
                ? `1 ${t('issue')}`
                : `${visibleIssues.length} ${t('issues')}`}
            </span>
            <span
              title={`${progressPercent}%`}
              style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}
            >
              <span style={{ color: TASK_TOKENS.textSecondary }}>
                {`${doneCount} / ${visibleIssues.length} ${t('done')}`}
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
                    width: `${progressPercent}%`,
                  }}
                />
              </span>
              <span style={{ fontWeight: 600, minWidth: 32 }}>
                {`${progressPercent}%`}
              </span>
            </span>
          </span>
        </div>
      </div>

      <div
        onMouseMove={(event) => updateColumnResize(event.clientX)}
        onMouseUp={(event) => endColumnResize(event.clientX)}
        onMouseLeave={(event) => endColumnResize(event.clientX)}
        style={{
          alignItems: 'stretch',
          cursor: columnResize === null ? 'auto' : 'col-resize',
          display: 'flex',
          flex: 1,
          gap: 12,
          minHeight: 0,
          overflowX: 'auto',
          ...TASK_THIN_SCROLLBAR_STYLE,
          padding: '0 20px 20px 20px',
          // A resize drag would otherwise sweep a text selection across
          // every card it passes.
          userSelect: columnResize === null ? 'auto' : 'none',
        }}
      >
        {columns.map((column, columnIndex) => {
          const cards = issuesByStatus.get(column.id) ?? [];
          const shownCardCount =
            shownCardCountByStatus[column.id] ?? CARDS_PER_COLUMN_PAGE;
          const shownCards = cards.slice(0, shownCardCount);
          const remainingCardCount = cards.length - shownCards.length;
          const isOlderDoneToggleColumn = column.id === olderDoneToggleColumnId;
          const isDropTarget = dropTargetStatusId === column.id;
          const isReorderable = column.id !== NO_STATUS_VALUE;
          const isColumnDragged = draggingStatusId === column.id;
          // Which edge the dragged column will land against, so the bar shows
          // the slot it takes rather than just the column it is over.
          const columnDropSide =
            draggingStatusId === null || statusDropTargetId !== column.id
              ? null
              : columns.findIndex((candidate) => candidate.id === draggingStatusId) <
                  columns.findIndex((candidate) => candidate.id === column.id)
                ? 'right'
                : 'left';

          return (
            <section
              key={column.id}
              onDragOver={(event) => {
                if (draggingStatusId !== null) {
                  // Not preventing the default is what marks this column as
                  // no drop target: the uncategorised column and the dragged
                  // one itself.
                  if (isReorderable && !isColumnDragged) {
                    event.preventDefault();
                    setStatusDropTargetId(column.id);
                  }

                  return;
                }

                event.preventDefault();

                // Guarded like the card's dragstart: the sandbox proxy has no
                // dataTransfer, and an unguarded write throws into the host's
                // error banner on every hover.
                if (event.dataTransfer) {
                  event.dataTransfer.dropEffect = 'move';
                }

                setDropTargetStatusId(column.id);
              }}
              onDragLeave={() => {
                setDropTargetStatusId((current) =>
                  current === column.id ? null : current,
                );
                setStatusDropTargetId((current) =>
                  current === column.id ? null : current,
                );
              }}
              onDrop={(event) => {
                event.preventDefault();

                if (draggingStatusId !== null) {
                  if (isReorderable && !isColumnDragged) {
                    void reorderStatuses(draggingStatusId, column.id);
                  }

                  return;
                }

                // Without dataTransfer the payload falls back to the card's
                // own dragstart state, which the board already tracks for the
                // drag ghost — so dropping works in the sandbox too.
                const payload = event.dataTransfer?.getData('text/plain') ?? '';
                const issueId =
                  payload !== '' ? payload : draggingIssueId;

                if (issueId !== null && issueId !== '') {
                  void moveIssue(issueId, column.id);
                }
              }}
              style={{
                background: isDropTarget
                  ? TASK_TOKENS.accentSoft
                  : TASK_TOKENS.backgroundSecondary,
                border: `1px solid ${isDropTarget ? TASK_TOKENS.accent : TASK_TOKENS.borderLight}`,
                borderRadius: TASK_TOKENS.radius,
                boxShadow:
                  columnDropSide === 'left'
                    ? `inset 3px 0 0 ${TASK_TOKENS.accent}`
                    : columnDropSide === 'right'
                      ? `inset -3px 0 0 ${TASK_TOKENS.accent}`
                      : 'none',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                maxHeight: '100%',
                minHeight: 0,
                opacity: isColumnDragged ? 0.5 : 1,
                position: 'relative',
                width: columnWidth,
              }}
            >
              {/* Sits in the gap to the next column, so it never covers a
                  card's own controls. A sibling of the header, not inside it:
                  the header is draggable, and a press here must not start a
                  column move. */}
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label={t('Resize column')}
                title={t('Drag to resize · Double-click to reset')}
                onMouseDown={(event) =>
                  setColumnResize({
                    statusId: column.id,
                    columnIndex,
                    startX: event.clientX,
                    startWidth: columnWidth,
                  })
                }
                onDoubleClick={resetColumnWidth}
                onMouseEnter={() => setHoveredResizeId(column.id)}
                onMouseLeave={() => setHoveredResizeId(null)}
                style={{
                  bottom: 0,
                  cursor: 'col-resize',
                  display: 'flex',
                  justifyContent: 'center',
                  position: 'absolute',
                  right: -10,
                  top: 0,
                  // The strip only stops selecting once the resize state has
                  // rendered; a press that starts here must not begin one.
                  userSelect: 'none',
                  width: 8,
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    background:
                      columnResize?.statusId === column.id
                        ? TASK_TOKENS.accent
                        : hoveredResizeId === column.id &&
                            columnResize === null
                          ? TASK_TOKENS.borderStrong
                          : 'transparent',
                    borderRadius: 1,
                    height: '100%',
                    width: 2,
                  }}
                />
              </div>
              <header
                draggable={isReorderable}
                title={isReorderable ? t('Drag to reorder columns') : undefined}
                onMouseEnter={() => setHoveredHeaderId(column.id)}
                onMouseLeave={() => setHoveredHeaderId(null)}
                onDragStart={(event) => {
                  // Same guard as the card's dragstart: the sandbox proxy has
                  // no dataTransfer, and state carries the drag regardless.
                  try {
                    event.dataTransfer?.setData('text/plain', column.name);

                    if (event.dataTransfer) {
                      event.dataTransfer.effectAllowed = 'move';
                    }
                  } catch {
                    // Sandbox proxy: state carries the payload.
                  }

                  setDraggingStatusId(column.id);
                }}
                onDragEnd={() => {
                  setDraggingStatusId(null);
                  setStatusDropTargetId(null);
                }}
                style={{
                  alignItems: 'center',
                  cursor: isReorderable ? 'grab' : 'default',
                  display: 'flex',
                  flexShrink: 0,
                  gap: 8,
                  padding: '12px 12px 8px 6px',
                }}
              >
                {/* Room held whether shown or not, so the title never shifts
                    when the grip appears under the pointer. */}
                <span
                  style={{
                    display: 'inline-flex',
                    flexShrink: 0,
                    marginRight: -4,
                    visibility:
                      isReorderable && hoveredHeaderId === column.id
                        ? 'visible'
                        : 'hidden',
                  }}
                >
                  <IconGripVertical size={14} color={TASK_TOKENS.textTertiary} />
                </span>
                <span
                  style={{
                    background: readTagColor(column.color).text,
                    ...TASK_CIRCLE_STYLE,
                    flexShrink: 0,
                    height: 8,
                    width: 8,
                  }}
                />
                <span
                  style={{
                    color: TASK_TOKENS.textSecondary,
                    flex: 1,
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column.name}
                </span>
                {doneStatusIds.has(column.id) && (
                  <span title={t('Done')} style={{ display: 'inline-flex', flexShrink: 0 }}>
                    <IconCheck size={14} color={readTagColor('green').text} stroke={2.5} />
                  </span>
                )}
                <span
                  style={{
                    background: TASK_TOKENS.backgroundTertiary,
                    borderRadius: TASK_TOKENS.radiusSmall,
                    color: TASK_TOKENS.textSecondary,
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 11,
                    lineHeight: '16px',
                    minWidth: 16,
                    padding: '0 4px',
                    textAlign: 'center',
                  }}
                >
                  {cards.length}
                </span>
              </header>

              <div
                onScroll={(event) => {
                  if (remainingCardCount <= 0) {
                    return;
                  }

                  // scrollTop rides the event; the heights come from the
                  // host's geometry snapshots, a frame behind at most, which
                  // the threshold absorbs. A zero height means not measured
                  // yet, never "at the bottom".
                  const scroller = event.currentTarget;
                  const distanceToBottom =
                    scroller.scrollHeight -
                    scroller.clientHeight -
                    scroller.scrollTop;

                  if (
                    scroller.scrollHeight > 0 &&
                    distanceToBottom < LAZY_LOAD_THRESHOLD_PX
                  ) {
                    showMoreCards(column.id, shownCardCount);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  gap: 8,
                  minHeight: 0,
                  overflowY: 'auto',
                  ...TASK_THIN_SCROLLBAR_STYLE,
                  padding: '4px 8px 8px 8px',
                }}
              >
                {cards.length === 0 && draggingIssueId !== null && (
                  <span
                    style={{
                      border: `1px dashed ${isDropTarget ? TASK_TOKENS.accent : TASK_TOKENS.borderStrong}`,
                      borderRadius: TASK_TOKENS.radius,
                      color: isDropTarget
                        ? TASK_TOKENS.accent
                        : TASK_TOKENS.textTertiary,
                      flexShrink: 0,
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 12,
                      padding: '16px 8px',
                      textAlign: 'center',
                    }}
                  >
                    {t('Drop here')}
                  </span>
                )}
                {shownCards.map((issue) => (
                  <TaskBoardCard
                    key={issue.id}
                    issue={issue}
                    statusOptions={statusOptions}
                    assigneeName={
                      issue.assigneeId === null ||
                      issue.assigneeId === undefined
                        ? null
                        : readMemberName(
                            membersById,
                            issue.assigneeId,
                            t('Unknown'),
                          )
                    }
                    assigneeAvatarUrl={
                      membersById.get(issue.assigneeId ?? '')?.avatarUrl
                    }
                    epicName={
                      typeof issue.epicId === 'string'
                        ? (epicNamesById.get(issue.epicId) ?? null)
                        : null
                    }
                    isDone={doneStatusIds.has(issue.statusId ?? '')}
                    isSelected={selectedIssueId === issue.id}
                    isDragging={draggingIssueId === issue.id}
                    onOpen={() => setSelectedIssueId(issue.id)}
                    onMove={(statusId) => void moveIssue(issue.id, statusId)}
                    onDelete={() => void deleteIssue(issue.id)}
                    onDragStartCard={() => setDraggingIssueId(issue.id)}
                    onDragEndCard={() => {
                      setDraggingIssueId(null);
                      setDropTargetStatusId(null);
                    }}
                  />
                ))}

                {/* Scrolling near the bottom draws the next page. The line
                    is a click target too, for a reader on a keyboard or a
                    column the host has not measured yet. */}
                {remainingCardCount > 0 && (
                  <button
                    type="button"
                    onClick={() => showMoreCards(column.id, shownCardCount)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: TASK_TOKENS.textTertiary,
                      cursor: 'pointer',
                      flexShrink: 0,
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 12,
                      padding: '6px 0',
                    }}
                  >
                    {t('{count} more issues', { count: remainingCardCount })}
                  </button>
                )}

                {isOlderDoneToggleColumn &&
                  (shouldIncludeOlderDone ? (
                    <TaskColumnFooterButton
                      onClick={() => setShouldIncludeOlderDone(false)}
                    >
                      {t('Hide done issues older than {days} days', {
                        days: BOARD_DONE_ISSUE_VISIBLE_DAYS,
                      })}
                    </TaskColumnFooterButton>
                  ) : (
                    <TaskColumnFooterButton
                      onClick={() => setShouldIncludeOlderDone(true)}
                    >
                      {t('Show {count} older done issues', {
                        count: board.hiddenDoneIssueCount,
                      })}
                    </TaskColumnFooterButton>
                  ))}

                {composerStatusId === column.id ? (
                  <div
                    style={{
                      background: TASK_TOKENS.background,
                      border: `1px solid ${TASK_TOKENS.accent}`,
                      borderRadius: TASK_TOKENS.radius,
                      boxShadow: `0 0 0 1px ${TASK_TOKENS.accent}`,
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      flexShrink: 0,
                      gap: 8,
                      padding: 8,
                    }}
                  >
                    <TaskTextInput
                      key={composerKey}
                      ariaLabel={t('Issue title')}
                      placeholder={t('What needs to be done?')}
                      shouldAutoFocus
                      value={composerTitle}
                      onChange={setComposerTitle}
                      onEnter={createIssue}
                      onEscape={closeComposer}
                    />
                    <div style={{ alignItems: 'center', display: 'flex', gap: 4 }}>
                      <TaskBoardSelect
                        ariaLabel={t('Issue type')}
                        width={112}
                        value={composerType}
                        options={ISSUE_TYPE_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                          color: option.color,
                        }))}
                        onChange={setComposerType}
                      />
                      <span style={{ flex: 1 }} />
                      <TaskIconButton label={t('Cancel')} onClick={closeComposer}>
                        <IconX size={14} />
                      </TaskIconButton>
                      <TaskButton
                        size="small"
                        variant="primary"
                        title={t('Create (Enter)')}
                        isDisabled={composerTitle.trim() === '' || isCreating}
                        onClick={createIssue}
                      >
                        {t('Create')}
                      </TaskButton>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setComposerStatusId(column.id);
                      setComposerTitle('');
                    }}
                    onMouseEnter={() => setHoveredCreateColumnId(column.id)}
                    onMouseLeave={() => setHoveredCreateColumnId(null)}
                    style={{
                      alignItems: 'center',
                      background:
                        hoveredCreateColumnId === column.id
                          ? TASK_TOKENS.backgroundHover
                          : 'transparent',
                      border: 'none',
                      borderRadius: TASK_TOKENS.radiusSmall,
                      color:
                        hoveredCreateColumnId === column.id
                          ? TASK_TOKENS.textSecondary
                          : TASK_TOKENS.textTertiary,
                      cursor: 'pointer',
                      display: 'flex',
                      flexShrink: 0,
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 13,
                      gap: 6,
                      justifyContent: 'flex-start',
                      minHeight: 32,
                      padding: '0 8px',
                      width: '100%',
                    }}
                  >
                    <IconPlus size={14} />
                    {t('Create issue')}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div style={{ flexShrink: 0, padding: '0 20px' }}>
        <TaskStatusLine text={loadError} tone="danger" />
      </div>

      {selectedIssueId !== null && (
        // Through the host's <twenty-overlay>, not inline: its children
        // portal to the document body, outside the page-layout scroll
        // wrapper whose `container-type: size` traps every inline
        // `position: fixed` inside the content box. See TaskBoardDetailFrame.
        //
        // Deliberately WITHOUT onClose: this overlay wraps the whole modal,
        // and the host closes an overlay on any pointerdown outside it —
        // including inside a NESTED overlay's portal, which is where every
        // dropdown in the modal lives. With onClose, picking a status or
        // ticking a checkbox would dismiss the modal itself. Outside-close
        // is the backdrop's own onClick below, and Escape is handled on the
        // dialog, so nothing is lost.
        <twenty-overlay>
          <TaskBoardDetail
            issueId={selectedIssueId}
            navIssueIds={navIssueIds}
            onSelectIssue={setSelectedIssueId}
            onClose={() => setSelectedIssueId(null)}
            boardPath={boardPath}
            onCardChanged={refreshBoard}
          />
        </twenty-overlay>
      )}
    </TaskBoardFrame>
  );
};

// A quiet full-width link at the foot of a column: more cards, or the older
// done issues. Hover is state-driven, as everywhere in this app.
const TaskColumnFooterButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
        border: `1px dashed ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radiusSmall,
        color: isHovered ? TASK_TOKENS.textPrimary : TASK_TOKENS.textSecondary,
        cursor: 'pointer',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12,
        minHeight: 30,
        padding: '0 8px',
        width: '100%',
      }}
    >
      {children}
    </button>
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
    'Jira-style board: one column per project status, drag-and-drop, inline create and the issue detail as a drawer.',
  component: TaskBoard,
});
