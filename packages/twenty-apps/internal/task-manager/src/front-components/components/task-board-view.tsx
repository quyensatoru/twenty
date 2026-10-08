import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useMemo,
  useState,
} from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconCheck, IconGripVertical, IconPlus, IconX } from 'twenty-ui/icon';

import { BOARD_DONE_ISSUE_VISIBLE_DAYS } from '../../constants/board-done-issue-visible-days';
import { type IssueCardFieldKey } from '../../constants/issue-view-fields';
import { ISSUE_TYPE_OPTIONS } from '../../constants/issue-type-options';
import {
  BOARD_COLUMN_ISSUES_ROUTE_PATH,
  CREATE_ISSUE_ROUTE_PATH,
  CREATE_ISSUE_STATUS_ROUTE_PATH,
  DELETE_ISSUE_ROUTE_PATH,
  REORDER_ISSUE_STATUSES_ROUTE_PATH,
  UPDATE_ISSUE_ROUTE_PATH,
} from '../../constants/route-paths';
import {
  type BoardColumnIssuesResponse,
  type BoardColumnPage,
  type BoardData,
  type BoardEpic,
  type BoardIssue,
  type BoardMember,
  type BoardStatus,
  type PageInset,
} from '../../types/task-board';
import { readEpicColor } from '../../utils/epic-color.util';
import {
  clampColumnWidth,
  COLUMN_DEFAULT_WIDTH,
  parseColumnWidth,
} from '../utils/column-widths.util';
import { moveIdOnto } from '../utils/move-id-onto.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskBoardAddStatus } from './task-board-add-status';
import { TaskBoardCard } from './task-board-card';
import { TaskBoardDetail } from './task-board-detail';
import { TaskBoardSelect } from './task-board-select';
import { TaskButton } from './task-button';
import { TaskIconButton } from './task-icon-button';
import { TaskStatusLine } from './task-status-line';
import { TaskTextInput } from './task-text-input';
import {
  readTagColor,
  TASK_CIRCLE_STYLE,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './task-tokens';

export const NO_STATUS_VALUE = 'NO_STATUS';
const COLUMN_WIDTH_STORAGE_KEY = 'task-board.column-width';
// How close to a column's bottom its next page is fetched: a little ahead, so
// the reader does not hit the end before the cards are there.
const LAZY_LOAD_THRESHOLD_PX = 400;

const readColumnKey = (statusId: string | null | undefined) =>
  typeof statusId === 'string' ? statusId : NO_STATUS_VALUE;

// Shifts one column's total, for the optimistic moves and deletes: the totals
// are the server's, and a card leaving or arriving changes them before it
// answers again.
const shiftColumnTotal = (
  columnPages: Record<string, BoardColumnPage>,
  columnKey: string,
  delta: number,
): Record<string, BoardColumnPage> => {
  const page = columnPages[columnKey];

  return page === undefined
    ? columnPages
    : {
        ...columnPages,
        [columnKey]: {
          ...page,
          totalCount: Math.max(0, page.totalCount + delta),
        },
      };
};

// The sandbox's localStorage is seeded from the host before the first render,
// so this reads synchronously. Guarded anyway: a store that is missing or
// full must never take the board down with it.
export const readStoredColumnWidth = (): number => {
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

// The column whose edge is held, and where it sits: every column takes the
// same width, so the held edge moves (index + 1) times the width change.
type ColumnResize = {
  statusId: string;
  columnIndex: number;
  startX: number;
  startWidth: number;
};

type TaskBoardViewProps = {
  board: BoardData;
  setBoard: Dispatch<SetStateAction<BoardData | null>>;
  boardQueryBody: Record<string, unknown>;
  // Bumped by the page on every full load, so a column page that was in
  // flight when the project or a filter changed is dropped.
  boardGenerationRef: MutableRefObject<number>;
  loadingColumnKeys: string[];
  setLoadingColumnKeys: Dispatch<SetStateAction<string[]>>;
  statuses: BoardStatus[];
  doneStatusIds: Set<string>;
  membersById: Map<string, BoardMember>;
  epicsById: Map<string, BoardEpic>;
  sprintNamesById: Map<string, string>;
  hiddenCardFields: readonly IssueCardFieldKey[];
  selectedIssueId: string | null;
  setSelectedIssueId: (issueId: string | null) => void;
  refreshBoard: () => void;
  shouldIncludeOlderDone: boolean;
  setShouldIncludeOlderDone: (shouldIncludeOlderDone: boolean) => void;
  composerStatusId: string | null;
  setComposerStatusId: (statusId: string | null) => void;
  // What a card created here joins: the sprint and epic the board shows, so
  // it does not vanish from the filtered board the moment it is created.
  newIssueSprintId: string | null;
  newIssueEpicId: string | null;
  loadError: string | null;
  boardPath: string | null;
  // The page's side padding, narrower on a phone.
  inset: PageInset;
};

// The board's columns: one per project status, drag-and-drop between them,
// inline create per column, and the issue detail as a drawer over them.
export const TaskBoardView = ({
  board,
  setBoard,
  boardQueryBody,
  boardGenerationRef,
  loadingColumnKeys,
  setLoadingColumnKeys,
  statuses,
  doneStatusIds,
  membersById,
  epicsById,
  sprintNamesById,
  hiddenCardFields,
  selectedIssueId,
  setSelectedIssueId,
  refreshBoard,
  shouldIncludeOlderDone,
  setShouldIncludeOlderDone,
  composerStatusId,
  setComposerStatusId,
  newIssueSprintId,
  newIssueEpicId,
  loadError,
  boardPath,
  inset,
}: TaskBoardViewProps) => {
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

  // The header search never narrows the columns: it only feeds the global
  // results popover (jump-to-issue), so typing never rearranges the board
  // under the pointer. The filters above already narrowed what was loaded.
  const issuesByStatus = useMemo(() => {
    const grouped = new Map<string, BoardIssue[]>();

    for (const issue of board.issues ?? []) {
      const key = readColumnKey(issue.statusId);

      grouped.set(key, [...(grouped.get(key) ?? []), issue]);
    }

    return grouped;
  }, [board]);

  // A column's real size is the server's count, not the cards loaded so far.
  const readColumnTotal = (columnKey: string) =>
    board.columnPages[columnKey]?.totalCount ??
    (issuesByStatus.get(columnKey) ?? []).length;

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

  // Optimistic like the record page's status picker: the card sits in its new
  // column before the server confirms it, and a failed write puts everything
  // back with a toast rather than leaving the board lying.
  const moveIssue = async (issueId: string, statusId: string | null) => {
    const previousIssues = board.issues;
    const previousColumnPages = board.columnPages;
    const targetStatusId =
      statusId === NO_STATUS_VALUE ? null : (statusId as string);
    const fromColumnKey = readColumnKey(
      board.issues.find((issue) => issue.id === issueId)?.statusId,
    );
    const toColumnKey = readColumnKey(targetStatusId);

    setDropTargetStatusId(null);
    setDraggingIssueId(null);

    if (fromColumnKey === toColumnKey) {
      return;
    }

    setBoard({
      ...board,
      issues: board.issues.map((issue) =>
        issue.id === issueId
          ? { ...issue, statusId: targetStatusId }
          : issue,
      ),
      columnPages: shiftColumnTotal(
        shiftColumnTotal(board.columnPages, fromColumnKey, -1),
        toColumnKey,
        1,
      ),
    });

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { statusId: targetStatusId },
      });
    } catch (error) {
      setBoard({
        ...board,
        issues: previousIssues,
        columnPages: previousColumnPages,
      });
      const message = readErrorText(error);
      void enqueueSnackbar({ message, variant: 'error' });
    }
  };

  // Optimistic like the move above: the card leaves at once, and a failed
  // write puts everything back. An open modal of the same issue closes with
  // it — its record is gone — and stays closed when the write fails, while
  // the card comes back.
  const deleteIssue = async (issueId: string) => {
    const previousIssues = board.issues;
    const previousColumnPages = board.columnPages;

    setBoard({
      ...board,
      issues: board.issues.filter((issue) => issue.id !== issueId),
      columnPages: shiftColumnTotal(
        board.columnPages,
        readColumnKey(
          board.issues.find((issue) => issue.id === issueId)?.statusId,
        ),
        -1,
      ),
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
      setBoard({
        ...board,
        issues: previousIssues,
        columnPages: previousColumnPages,
      });
      void enqueueSnackbar({
        message: readErrorText(error),
        variant: 'error',
      });
    }
  };

  const createIssue = async () => {
    const title = composerTitle.trim();
    const activeProjectId = board.activeProjectId ?? null;

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
          ...(newIssueSprintId === null ? {} : { sprintId: newIssueSprintId }),
          ...(newIssueEpicId === null ? {} : { epicId: newIssueEpicId }),
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

    const activeProjectId = board.activeProjectId ?? null;

    if (activeProjectId === null) {
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

  // Not optimistic: the column needs the id the server gives the status, and
  // the board reload brings it in at the position the server picked.
  const createStatus = async (input: {
    name: string;
    category: string;
    color: string;
  }): Promise<boolean> => {
    const activeProjectId = board.activeProjectId ?? null;

    if (activeProjectId === null) {
      return false;
    }

    try {
      await postAppRoute(CREATE_ISSUE_STATUS_ROUTE_PATH, {
        projectId: activeProjectId,
        ...input,
      });
      refreshBoard();
      void enqueueSnackbar({ message: t('Status added.'), variant: 'success' });

      return true;
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });

      return false;
    }
  };

  // The next page of one column, as it is scrolled near its end. One request
  // per column at a time, so a burst of scroll events fetches one page.
  const loadMoreColumn = async (columnKey: string) => {
    const page = board.columnPages[columnKey];
    const activeProjectId = board.activeProjectId ?? null;

    if (
      page === undefined ||
      activeProjectId === null ||
      !page.hasNextPage ||
      page.endCursor === null ||
      loadingColumnKeys.includes(columnKey)
    ) {
      return;
    }

    const generation = boardGenerationRef.current;

    setLoadingColumnKeys((current) => [...current, columnKey]);

    try {
      const result = await postAppRoute<
        BoardColumnIssuesResponse & { success: true }
      >(BOARD_COLUMN_ISSUES_ROUTE_PATH, {
        ...boardQueryBody,
        projectId: activeProjectId,
        statusId: columnKey === NO_STATUS_VALUE ? null : columnKey,
        after: page.endCursor,
      });

      if (generation !== boardGenerationRef.current) {
        return;
      }

      setBoard((current) => {
        if (current === null) {
          return current;
        }

        // A card moved into this column by hand can come back in its pages.
        const loadedIds = new Set(current.issues.map((issue) => issue.id));
        const knownMemberIds = new Set(
          current.members.map((member) => member.id),
        );

        return {
          ...current,
          issues: [
            ...current.issues,
            ...(result.issues ?? []).filter(
              (issue) => !loadedIds.has(issue.id),
            ),
          ],
          members: [
            ...current.members,
            ...(result.members ?? []).filter(
              (member) => !knownMemberIds.has(member.id),
            ),
          ],
          columnPages: {
            ...current.columnPages,
            [columnKey]: {
              totalCount: result.totalCount,
              endCursor: result.endCursor,
              hasNextPage: result.hasNextPage,
            },
          },
        };
      });
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setLoadingColumnKeys((current) =>
        current.filter((key) => key !== columnKey),
      );
    }
  };

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

  const readIssueEpicColor = (epicId: string | null | undefined) => {
    const epic = typeof epicId === 'string' ? epicsById.get(epicId) : undefined;

    return epic === undefined ? null : readEpicColor(epic);
  };

  const statusOptions = statuses.map((status) => ({
    value: status.id,
    label: status.name ?? status.id,
    color: status.color,
  }));

  const columns =
    statuses.length === 0
      ? [{ id: NO_STATUS_VALUE, name: t('Issues'), color: 'gray' as string | null }]
      : [
          ...statuses.map((status) => ({
            id: status.id,
            name: status.name ?? status.id,
            color: status.color ?? null,
          })),
          ...(readColumnTotal(NO_STATUS_VALUE) > 0
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
    <>
      <div
        onMouseMove={(event) => updateColumnResize(event.clientX)}
        onMouseUp={(event) => endColumnResize(event.clientX)}
        onMouseLeave={(event) => endColumnResize(event.clientX)}
        style={{
          // Each column is as tall as its cards, as on Jira, and only a full
          // one reaches the board's height and scrolls inside it.
          alignItems: 'flex-start',
          cursor: columnResize === null ? 'auto' : 'col-resize',
          display: 'flex',
          flex: 1,
          gap: 12,
          minHeight: 0,
          overflowX: 'auto',
          ...TASK_THIN_SCROLLBAR_STYLE,
          padding: `0 ${inset.right}px ${inset.right}px ${inset.left}px`,
          // A resize drag would otherwise sweep a text selection across
          // every card it passes.
          userSelect: columnResize === null ? 'auto' : 'none',
        }}
      >
        {columns.map((column, columnIndex) => {
          const cards = issuesByStatus.get(column.id) ?? [];
          const columnPage = board.columnPages[column.id];
          const columnTotal = readColumnTotal(column.id);
          const remainingCardCount = Math.max(0, columnTotal - cards.length);
          const hasMoreCards = columnPage?.hasNextPage === true;
          const isColumnLoading = loadingColumnKeys.includes(column.id);
          const isOlderDoneToggleColumn = column.id === olderDoneToggleColumnId;
          const isDropTarget = dropTargetStatusId === column.id;
          // Column order is a view everyone on the project shares, so it
          // follows the role's "Manage Views", not a write grant on the app.
          const isReorderable =
            column.id !== NO_STATUS_VALUE && board.canManageViews;
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
                  {columnTotal}
                </span>
              </header>

              <div
                onScroll={(event) => {
                  if (!hasMoreCards) {
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
                    void loadMoreColumn(column.id);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  // Content-sized, shrinking (and scrolling) only once the
                  // column hits the board's height with the create control
                  // still pinned under it.
                  flex: '0 1 auto',
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
                {cards.map((issue) => (
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
                        ? (epicsById.get(issue.epicId)?.name ?? null)
                        : null
                    }
                    epicColor={readIssueEpicColor(issue.epicId)}
                    sprintName={
                      typeof issue.sprintId === 'string'
                        ? (sprintNamesById.get(issue.sprintId) ?? null)
                        : null
                    }
                    reporterName={
                      typeof issue.reporterId === 'string'
                        ? readMemberName(
                            membersById,
                            issue.reporterId,
                            t('Unknown'),
                          )
                        : null
                    }
                    reporterAvatarUrl={
                      membersById.get(issue.reporterId ?? '')?.avatarUrl
                    }
                    hiddenFields={hiddenCardFields}
                    isDone={doneStatusIds.has(issue.statusId ?? '')}
                    isSelected={selectedIssueId === issue.id}
                    isDragging={draggingIssueId === issue.id}
                    canMove={board.canWrite}
                    canDelete={board.canSoftDelete}
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

                {/* Scrolling near the bottom fetches the next page. The line
                    is a click target too, for a reader on a keyboard or a
                    column the host has not measured yet. */}
                {hasMoreCards && (
                  <button
                    type="button"
                    disabled={isColumnLoading}
                    onClick={() => void loadMoreColumn(column.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: TASK_TOKENS.textTertiary,
                      cursor: isColumnLoading ? 'default' : 'pointer',
                      flexShrink: 0,
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 12,
                      padding: '6px 0',
                    }}
                  >
                    {isColumnLoading
                      ? t('Loading…')
                      : t('{count} more issues', { count: remainingCardCount })}
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

              </div>

              {/* Pinned under the cards rather than after the last one, so
                  creating in a long column never means scrolling to its end. */}
              {board.canWrite && (
                <div style={{ flexShrink: 0, padding: '0 8px 8px 8px' }}>
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
              )}
            </section>
          );
        })}
        {/* A new column is a change to everyone's board, so it follows the
            role's "Manage Views" like the column order and the card fields. */}
        {board.canManageViews && board.activeProjectId !== null && (
          <TaskBoardAddStatus onCreate={createStatus} />
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: `0 ${inset.right}px 0 ${inset.left}px`,
        }}
      >
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
    </>
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

