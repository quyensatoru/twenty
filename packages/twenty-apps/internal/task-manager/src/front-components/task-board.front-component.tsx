import { useCallback, useEffect, useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconPlus } from 'twenty-ui/icon';

import { ISSUE_TYPE_OPTIONS } from '../constants/issue-type-options';
import {
  CREATE_ISSUE_ROUTE_PATH,
  DELETE_ISSUE_ROUTE_PATH,
  TASK_BOARD_ROUTE_PATH,
  UPDATE_ISSUE_ROUTE_PATH,
} from '../constants/route-paths';
import { TASK_BOARD_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import {
  type BoardData,
  type BoardIssue,
  type BoardMember,
} from '../types/task-board';
import { TaskBoardCard } from './components/task-board-card';
import { TaskBoardDetail } from './components/task-board-detail';
import { TaskBoardSelect } from './components/task-board-select';
import { TaskButton } from './components/task-button';
import { TaskIssueSearch } from './components/task-issue-search';
import { TaskMessage } from './components/task-message';
import { TaskStatusLine } from './components/task-status-line';
import { TaskTextInput } from './components/task-text-input';
import { readTagColor, TASK_TOKENS } from './components/task-tokens';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';
import { readMemberName } from './utils/read-member-name.util';

const ALL_VALUE = 'ALL';
const BACKLOG_VALUE = 'BACKLOG';
const ME_VALUE = 'ME';
const NO_STATUS_VALUE = 'NO_STATUS';
const COLUMN_MIN_WIDTH = 272;

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
  const [board, setBoard] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [sprintFilter, setSprintFilter] = useState<string>(ALL_VALUE);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>(ALL_VALUE);
  const [typeFilter, setTypeFilter] = useState<string>(ALL_VALUE);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null);
  const [dropTargetStatusId, setDropTargetStatusId] = useState<string | null>(
    null,
  );
  const [composerStatusId, setComposerStatusId] = useState<string | null>(null);
  const [composerTitle, setComposerTitle] = useState('');
  const [composerType, setComposerType] = useState<string>('TASK');
  const [isCreating, setIsCreating] = useState(false);
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
        projectId === null
          ? {}
          : { projectId, ...(sprintId === undefined ? {} : { sprintId }) },
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
      });
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  }, [projectId, sprintId]);

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
    assigneeFilter !== ALL_VALUE ||
    typeFilter !== ALL_VALUE;

  const resetFilters = () => {
    setSearch('');
    setSprintFilter(ALL_VALUE);
    setAssigneeFilter(ALL_VALUE);
    setTypeFilter(ALL_VALUE);
  };

  const membersById = useMemo(
    () =>
      new Map<string, BoardMember>(
        (board?.members ?? []).map((member) => [member.id, member]),
      ),
    [board],
  );

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

      if (assigneeFilter === ME_VALUE) {
        if (
          board?.currentWorkspaceMemberId === null ||
          issue.assigneeId !== board?.currentWorkspaceMemberId
        ) {
          return false;
        }
      } else if (
        assigneeFilter !== ALL_VALUE &&
        issue.assigneeId !== assigneeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [board, assigneeFilter, typeFilter]);

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
      setComposerStatusId(null);
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

  const activeProject = (board?.projects ?? []).find(
    (project) => project.id === (projectId ?? board?.activeProjectId),
  );

  const statusOptions = statuses.map((status) => ({
    value: status.id,
    label: status.name ?? status.id,
    color: status.color,
  }));

  if (isLoading && board === null) {
    return (
      <TaskBoardFrame>
        <TaskMessage text={t('Loading board…')} />
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

  return (
    <TaskBoardFrame>
      <div
        style={{
          alignItems: 'stretch',
          background: TASK_TOKENS.background,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          gap: 6,
          padding: '12px 20px 8px 20px',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexShrink: 0,
            gap: 8,
          }}
        >
          <TaskBoardSelect
            ariaLabel={t('Project')}
            width={170}
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
              setSelectedIssueId(null);
              setComposerStatusId(null);
            }}
          />
          <TaskBoardSelect
            ariaLabel={t('Sprint')}
            width={140}
            value={sprintFilter}
            options={[
              { value: ALL_VALUE, label: t('All sprints') },
              { value: BACKLOG_VALUE, label: t('Backlog') },
              ...board.sprints.map((sprint) => ({
                value: sprint.id,
                label: sprint.name ?? sprint.id,
              })),
            ]}
            onChange={(value) => setSprintFilter(value)}
          />
        </div>
          <div
            style={{
              display: 'flex',
              flex: 1,
              justifyContent: 'center',
              minWidth: 200,
            }}
          >
          <TaskIssueSearch
            value={search}
            onChange={setSearch}
            onSelectIssue={selectSearchResult}
            isShortcutEnabled={selectedIssueId === null}
            maxWidth={560}
          />
        </div>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <TaskBoardSelect
            ariaLabel={t('Assignee')}
            width={140}
            value={assigneeFilter}
            options={[
              { value: ALL_VALUE, label: t('All assignees') },
              { value: ME_VALUE, label: t('Only my issues') },
              ...board.members.map((member) => ({
                value: member.id,
                label: readMemberName(membersById, member.id, member.id),
              })),
            ]}
            onChange={(value) => setAssigneeFilter(value)}
          />
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
          <TaskButton
            variant="primary"
            isDisabled={statuses.length === 0}
            onClick={() => {
              setComposerStatusId(statuses[0]?.id ?? NO_STATUS_VALUE);
              setComposerTitle('');
            }}
          >
            <IconPlus size={14} />
            {t('Create')}
          </TaskButton>
          </div>
        </div>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <span
            style={{
              alignItems: 'center',
              display: 'inline-flex',
              gap: 8,
            }}
          >
            <span
              style={{
                color: TASK_TOKENS.textTertiary,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              {visibleIssues.length === 1
                ? `1 ${t('issue')}`
                : `${visibleIssues.length} ${t('issues')}`}
            </span>
            {isFiltered && (
              <TaskButton size="small" variant="ghost" onClick={resetFilters}>
                {t('Reset')}
              </TaskButton>
            )}
          </span>
          <span
            style={{
              alignItems: 'center',
              display: 'inline-flex',
              gap: 8,
            }}
          >
          {typeof activeProject?.key === 'string' && (
            <span
              style={{
                color: TASK_TOKENS.textTertiary,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {activeProject.key}
            </span>
          )}
          <span
            style={{
              color: TASK_TOKENS.textSecondary,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            {`${doneCount} / ${visibleIssues.length} ${t('done')}`}
          </span>
          <span
            style={{
              background: TASK_TOKENS.backgroundTertiary,
              borderRadius: 4,
              height: 6,
              overflow: 'hidden',
              width: 120,
            }}
          >
            <span
              style={{
                background: TASK_TOKENS.accent,
                display: 'block',
                height: '100%',
                width: `${progressPercent}%`,
              }}
            />
          </span>
          </span>
        </div>
      </div>

      <div
        style={{
          alignItems: 'stretch',
          display: 'flex',
          flex: 1,
          gap: 12,
          minHeight: 0,
          overflowX: 'auto',
          padding: '0 20px 20px 20px',
        }}
      >
        {columns.map((column) => {
          const cards = issuesByStatus.get(column.id) ?? [];
          const isDropTarget = dropTargetStatusId === column.id;

          return (
            <section
              key={column.id}
              onDragOver={(event) => {
                event.preventDefault();

                // Guarded like the card's dragstart: the sandbox proxy has no
                // dataTransfer, and an unguarded write throws into the host's
                // error banner on every hover.
                if (event.dataTransfer) {
                  event.dataTransfer.dropEffect = 'move';
                }

                setDropTargetStatusId(column.id);
              }}
              onDragLeave={() =>
                setDropTargetStatusId((current) =>
                  current === column.id ? null : current,
                )
              }
              onDrop={(event) => {
                event.preventDefault();
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
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                maxHeight: '100%',
                minHeight: 0,
                width: COLUMN_MIN_WIDTH,
              }}
            >
              <header
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  flexShrink: 0,
                  gap: 8,
                  padding: '12px 12px 8px 12px',
                }}
              >
                <span
                  style={{
                    background: readTagColor(column.color).text,
                    borderRadius: '50%',
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
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  gap: 8,
                  minHeight: 0,
                  overflowY: 'auto',
                  padding: '4px 8px 8px 8px',
                }}
              >
                {cards.length === 0 && composerStatusId !== column.id && (
                  <span
                    style={{
                      border: `1px dashed ${TASK_TOKENS.borderStrong}`,
                      borderRadius: TASK_TOKENS.radius,
                      color: TASK_TOKENS.textTertiary,
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 12,
                      padding: '12px 8px',
                      textAlign: 'center',
                    }}
                  >
                    {draggingIssueId !== null
                      ? t('Drop here')
                      : t('No issues')}
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

                {composerStatusId === column.id ? (
                  <div
                    style={{
                      background: TASK_TOKENS.background,
                      border: `1px solid ${TASK_TOKENS.accent}`,
                      borderRadius: TASK_TOKENS.radius,
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      padding: 8,
                    }}
                  >
                    <TaskBoardSelect
                      ariaLabel={t('Issue type')}
                      width="100%"
                      value={composerType}
                      options={ISSUE_TYPE_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                        color: option.color,
                      }))}
                      onChange={setComposerType}
                    />
                    <TaskTextInput
                      ariaLabel={t('Issue title')}
                      placeholder={t('What needs to be done?')}
                      shouldAutoFocus
                      value={composerTitle}
                      onChange={setComposerTitle}
                      onEnter={createIssue}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <TaskButton
                        size="small"
                        onClick={() => {
                          setComposerStatusId(null);
                          setComposerTitle('');
                        }}
                      >
                        {t('Cancel')}
                      </TaskButton>
                      <TaskButton
                        size="small"
                        variant="primary"
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
                    style={{
                      alignItems: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: TASK_TOKENS.radiusSmall,
                      color: TASK_TOKENS.textTertiary,
                      cursor: 'pointer',
                      display: 'flex',
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 13,
                      gap: 4,
                      justifyContent: 'center',
                      minHeight: 32,
                      width: '100%',
                    }}
                  >
                    <IconPlus size={14} />
                    {t('Create')}
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
            onCardChanged={refreshBoard}
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
    'Jira-style board: one column per project status, drag-and-drop, inline create and the issue detail as a drawer.',
  component: TaskBoard,
});
