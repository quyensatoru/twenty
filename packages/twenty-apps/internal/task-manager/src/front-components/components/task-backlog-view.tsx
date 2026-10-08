import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconPlus, IconX } from 'twenty-ui/icon';

import { ISSUE_TYPE_OPTIONS } from '../../constants/issue-type-options';
import {
  BACKLOG_ROUTE_PATH,
  BACKLOG_SECTION_ISSUES_ROUTE_PATH,
  CREATE_ISSUE_ROUTE_PATH,
  CREATE_SPRINT_ROUTE_PATH,
  DELETE_SPRINT_ROUTE_PATH,
  RANK_ISSUE_ROUTE_PATH,
} from '../../constants/route-paths';
import {
  BACKLOG_SECTION_KEY,
  type BacklogData,
  type BacklogSection,
  type BacklogSectionIssuesResponse,
} from '../../types/backlog';
import {
  type BoardEpic,
  type BoardMember,
  type BoardSprint,
  type BoardStatus,
  type PageInset,
} from '../../types/task-board';
import { buildDefaultSprintName } from '../../utils/build-default-sprint-name.util';
import { readEpicColor } from '../../utils/epic-color.util';
import { formatSprintDateRange } from '../utils/format-sprint-date-range.util';
import { moveBacklogIssue } from '../utils/move-backlog-issue.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskActionMenu } from './task-action-menu';
import { TaskBacklogRow } from './task-backlog-row';
import { TaskBacklogSection } from './task-backlog-section';
import { TaskBacklogSkeleton } from './task-board-skeleton';
import { TaskBoardDetail } from './task-board-detail';
import { TaskBoardSelect } from './task-board-select';
import { TaskButton } from './task-button';
import { TaskCompleteSprintDialog } from './task-complete-sprint-dialog';
import { TaskIconButton } from './task-icon-button';
import { TaskMessage } from './task-message';
import { TaskSprintDialog } from './task-sprint-dialog';
import { TaskTextInput } from './task-text-input';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';

type DropTarget = {
  sectionKey: string;
  // The row the dragged one lands above; null = the end of the section.
  beforeIssueId: string | null;
};

type SprintDialogState = {
  mode: 'start' | 'edit';
  sprint: BoardSprint;
  issueCount: number;
};

type TaskBacklogViewProps = {
  projectId: string;
  projectKey: string | null;
  // Every sprint of the project, closed ones included, for the next name.
  allSprints: readonly BoardSprint[];
  statuses: readonly BoardStatus[];
  doneStatusIds: ReadonlySet<string>;
  epicsById: Map<string, BoardEpic>;
  queryBody: Record<string, unknown>;
  newIssueEpicId: string | null;
  canWrite: boolean;
  canSoftDelete: boolean;
  refreshKey: number;
  refreshBoard: () => void;
  selectedIssueId: string | null;
  setSelectedIssueId: (issueId: string | null) => void;
  // Shared with the epic panel, which takes a row dropped on an epic.
  draggingIssueId: string | null;
  setDraggingIssueId: (issueId: string | null) => void;
  composerSectionKey: string | null;
  setComposerSectionKey: (sectionKey: string | null) => void;
  boardPath: string | null;
  // A phone gets narrower padding and rows trimmed to key, title, status
  // and owner, as Jira's mobile backlog does.
  isMobile: boolean;
  inset: PageInset;
};

const readSectionSprintId = (sectionKey: string) =>
  sectionKey === BACKLOG_SECTION_KEY ? null : sectionKey;

// Jira's backlog: the active sprint, the planned ones, then the backlog, each
// a list of top-level issues ranked by drag. Issues move between sections by
// drag too, and the sprint lifecycle (create, start, edit, complete, delete)
// lives on the section headers.
export const TaskBacklogView = ({
  projectId,
  projectKey,
  allSprints,
  statuses,
  doneStatusIds,
  epicsById,
  queryBody,
  newIssueEpicId,
  canWrite,
  canSoftDelete,
  refreshKey,
  refreshBoard,
  selectedIssueId,
  setSelectedIssueId,
  draggingIssueId,
  setDraggingIssueId,
  composerSectionKey,
  setComposerSectionKey,
  boardPath,
  isMobile,
  inset,
}: TaskBacklogViewProps) => {
  const [backlog, setBacklog] = useState<BacklogData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [collapsedKeys, setCollapsedKeys] = useState<string[]>([]);
  const [loadingSectionKeys, setLoadingSectionKeys] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [sprintDialog, setSprintDialog] = useState<SprintDialogState | null>(
    null,
  );
  const [completingSprint, setCompletingSprint] = useState<BoardSprint | null>(
    null,
  );
  const [composerTitle, setComposerTitle] = useState('');
  const [composerType, setComposerType] = useState<string>('STORY');
  const [composerKey, setComposerKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  // Bumped on every full load, so a section page in flight when a filter
  // changed is dropped instead of landing on the new backlog.
  // oxlint-disable-next-line twenty/no-state-useref
  const generationRef = useRef(0);

  const loadBacklog = useCallback(async () => {
    generationRef.current += 1;
    setLoadingSectionKeys([]);

    try {
      const result = await postAppRoute<BacklogData & { success: true }>(
        BACKLOG_ROUTE_PATH,
        { projectId, ...queryBody },
      );

      setBacklog({
        sprints: result.sprints ?? [],
        sections: result.sections ?? [],
        members: result.members ?? [],
        subtaskCountByIssueId: result.subtaskCountByIssueId ?? {},
      });
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  }, [projectId, queryBody]);

  useEffect(() => {
    void loadBacklog();
  }, [loadBacklog, refreshKey]);

  const membersById = useMemo(
    () =>
      new Map<string, BoardMember>(
        (backlog?.members ?? []).map((member) => [member.id, member]),
      ),
    [backlog],
  );
  const statusesById = useMemo(
    () => new Map(statuses.map((status) => [status.id, status])),
    [statuses],
  );
  const sprintsById = useMemo(
    () =>
      new Map((backlog?.sprints ?? []).map((sprint) => [sprint.id, sprint])),
    [backlog],
  );
  const activeSprint = (backlog?.sprints ?? []).find(
    (sprint) => sprint.state === 'ACTIVE',
  );
  const navIssueIds = useMemo(
    () =>
      (backlog?.sections ?? []).flatMap((section) =>
        section.issues.map((issue) => issue.id),
      ),
    [backlog],
  );

  const toggleCollapsed = (sectionKey: string) =>
    setCollapsedKeys((current) =>
      current.includes(sectionKey)
        ? current.filter((key) => key !== sectionKey)
        : [...current, sectionKey],
    );

  const endDrag = () => {
    setDraggingIssueId(null);
    setDropTarget(null);
  };

  // Optimistic like the board's column moves: the row lands at once, and a
  // refused write puts every section back.
  const dropIssue = async (target: DropTarget) => {
    const issueId = draggingIssueId;

    endDrag();

    if (backlog === null || issueId === null) {
      return;
    }

    const previousSections = backlog.sections;
    const nextSections = moveBacklogIssue({
      sections: previousSections,
      issueId,
      targetSectionKey: target.sectionKey,
      beforeIssueId: target.beforeIssueId,
    });

    if (nextSections === previousSections) {
      return;
    }

    setBacklog({ ...backlog, sections: nextSections });

    try {
      await postAppRoute(RANK_ISSUE_ROUTE_PATH, {
        issueId,
        sprintId: readSectionSprintId(target.sectionKey),
        ...(target.beforeIssueId === null
          ? {}
          : { beforeIssueId: target.beforeIssueId }),
      });
    } catch (error) {
      setBacklog((current) =>
        current === null ? current : { ...current, sections: previousSections },
      );
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    }
  };

  const loadMoreSection = async (section: BacklogSection) => {
    if (
      !section.hasNextPage ||
      section.endCursor === null ||
      loadingSectionKeys.includes(section.key)
    ) {
      return;
    }

    const generation = generationRef.current;

    setLoadingSectionKeys((current) => [...current, section.key]);

    try {
      const result = await postAppRoute<
        BacklogSectionIssuesResponse & { success: true }
      >(BACKLOG_SECTION_ISSUES_ROUTE_PATH, {
        ...queryBody,
        projectId,
        sectionSprintId: section.sprintId,
        after: section.endCursor,
      });

      if (generation !== generationRef.current) {
        return;
      }

      setBacklog((current) => {
        if (current === null) {
          return current;
        }

        const knownMemberIds = new Set(
          current.members.map((member) => member.id),
        );

        return {
          ...current,
          members: [
            ...current.members,
            ...(result.members ?? []).filter(
              (member) => !knownMemberIds.has(member.id),
            ),
          ],
          subtaskCountByIssueId: {
            ...current.subtaskCountByIssueId,
            ...(result.subtaskCountByIssueId ?? {}),
          },
          sections: current.sections.map((currentSection) => {
            if (currentSection.key !== section.key) {
              return currentSection;
            }

            // A row dragged in by hand can come back in the next page.
            const loadedIds = new Set(
              currentSection.issues.map((issue) => issue.id),
            );

            return {
              ...currentSection,
              issues: [
                ...currentSection.issues,
                ...(result.issues ?? []).filter(
                  (issue) => !loadedIds.has(issue.id),
                ),
              ],
              endCursor: result.endCursor,
              hasNextPage: result.hasNextPage,
            };
          }),
        };
      });
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setLoadingSectionKeys((current) =>
        current.filter((key) => key !== section.key),
      );
    }
  };

  // A new issue starts in the first "to do" status, as Jira's backlog create
  // does, and lands at the bottom of the section it was typed into.
  const defaultStatusId =
    statuses.find((status) => status.category === 'UNSTARTED')?.id ??
    statuses[0]?.id ??
    null;

  const closeComposer = () => {
    setComposerSectionKey(null);
    setComposerTitle('');
  };

  const createIssue = async () => {
    const title = composerTitle.trim();

    if (title === '' || composerSectionKey === null || isCreating) {
      return;
    }

    const sprintId = readSectionSprintId(composerSectionKey);

    setIsCreating(true);

    try {
      await postAppRoute(CREATE_ISSUE_ROUTE_PATH, {
        projectId,
        data: {
          title,
          issueType: composerType,
          statusId: defaultStatusId,
          position: 'last',
          ...(sprintId === null ? {} : { sprintId }),
          ...(newIssueEpicId === null ? {} : { epicId: newIssueEpicId }),
        },
      });
      setComposerTitle('');
      setComposerKey((key) => key + 1);
      await loadBacklog();
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const createSprint = async () => {
    try {
      await postAppRoute(CREATE_SPRINT_ROUTE_PATH, {
        projectId,
        data: {
          name: buildDefaultSprintName({
            projectKey,
            existingNames: allSprints.map((sprint) => sprint.name),
          }),
          state: 'FUTURE',
          position: 'last',
        },
      });
      refreshBoard();
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    }
  };

  const deleteSprint = async (sprint: BoardSprint) => {
    try {
      await postAppRoute(DELETE_SPRINT_ROUTE_PATH, { sprintId: sprint.id });
      void enqueueSnackbar({ message: t('Sprint deleted.'), variant: 'success' });
      refreshBoard();
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    }
  };

  const closeDialogsAndRefresh = () => {
    setSprintDialog(null);
    setCompletingSprint(null);
    refreshBoard();
  };

  if (backlog === null) {
    return loadError === null ? (
      <div
        style={{
          padding: `0 ${inset.right}px ${inset.right}px ${inset.left}px`,
        }}
      >
        <TaskBacklogSkeleton />
      </div>
    ) : (
      <TaskMessage text={loadError} tone="danger" />
    );
  }

  const renderSectionAction = (
    sprint: BoardSprint | undefined,
    section: BacklogSection,
  ) => {
    if (!canWrite || sprint === undefined) {
      return null;
    }

    if (sprint.state === 'ACTIVE') {
      return (
        <TaskButton size="small" onClick={() => setCompletingSprint(sprint)}>
          {t('Complete sprint')}
        </TaskButton>
      );
    }

    const blockedReason =
      activeSprint !== undefined
        ? t('Complete {name} before starting another sprint.', {
            name: activeSprint.name ?? '',
          })
        : section.unfilteredCount === 0
          ? t('Add issues to the sprint before starting it.')
          : undefined;

    return (
      <TaskButton
        size="small"
        title={blockedReason}
        isDisabled={blockedReason !== undefined}
        onClick={() =>
          setSprintDialog({
            mode: 'start',
            sprint,
            issueCount: section.unfilteredCount,
          })
        }
      >
        {t('Start sprint')}
      </TaskButton>
    );
  };

  const renderSectionMenu = (
    sprint: BoardSprint | undefined,
    section: BacklogSection,
  ) =>
    sprint === undefined ? null : (
      <TaskActionMenu
        label={t('Sprint actions')}
        items={[
          ...(canWrite
            ? [
                {
                  key: 'edit',
                  label: t('Edit sprint'),
                  onSelect: () =>
                    setSprintDialog({
                      mode: 'edit',
                      sprint,
                      issueCount: section.unfilteredCount,
                    }),
                },
              ]
            : []),
          ...(canSoftDelete && sprint.state !== 'ACTIVE'
            ? [
                {
                  key: 'delete',
                  label: t('Delete sprint'),
                  isDanger: true,
                  confirmLabel:
                    section.unfilteredCount === 0
                      ? t('Confirm delete?')
                      : t('Delete · {count} issues go to the backlog', {
                          count: section.unfilteredCount,
                        }),
                  onSelect: () => void deleteSprint(sprint),
                },
              ]
            : []),
        ]}
      />
    );

  const renderComposer = (sectionKey: string) =>
    !canWrite ? null : composerSectionKey === sectionKey ? (
      <div
        style={{
          alignItems: 'center',
          borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
          display: 'flex',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 8,
          padding: 8,
        }}
      >
        <TaskBoardSelect
          ariaLabel={t('Issue type')}
          width={112}
          value={composerType}
          options={ISSUE_TYPE_OPTIONS.filter(
            (option) => option.value !== 'SUBTASK',
          ).map((option) => ({
            value: option.value,
            label: option.label,
            color: option.color,
          }))}
          onChange={setComposerType}
        />
        <div
          style={{
            flex: 1,
            // On a phone the title takes its own line above the controls.
            minWidth: isMobile ? '100%' : 0,
            order: isMobile ? -1 : 0,
          }}
        >
          <TaskTextInput
            key={composerKey}
            ariaLabel={t('Issue title')}
            placeholder={t('What needs to be done?')}
            shouldAutoFocus
            value={composerTitle}
            onChange={setComposerTitle}
            onEnter={() => void createIssue()}
            onEscape={closeComposer}
          />
        </div>
        <TaskIconButton label={t('Cancel')} onClick={closeComposer}>
          <IconX size={14} />
        </TaskIconButton>
        <TaskButton
          size="small"
          variant="primary"
          isDisabled={composerTitle.trim() === '' || isCreating}
          onClick={() => void createIssue()}
        >
          {t('Create')}
        </TaskButton>
      </div>
    ) : (
      <div style={{ padding: 4 }}>
        <TaskButton
          variant="ghost"
          onClick={() => {
            setComposerSectionKey(sectionKey);
            setComposerTitle('');
          }}
        >
          <IconPlus size={14} />
          {t('Create issue')}
        </TaskButton>
      </div>
    );

  const renderSection = (section: BacklogSection) => {
    const sprint =
      section.sprintId === null ? undefined : sprintsById.get(section.sprintId);
    const isEndDropTarget =
      dropTarget?.sectionKey === section.key && dropTarget.beforeIssueId === null;
    const remainingCount = Math.max(0, section.totalCount - section.issues.length);
    const issueCountLabel =
      section.totalCount === section.unfilteredCount
        ? section.unfilteredCount === 1
          ? t('1 issue')
          : t('{count} issues', { count: section.unfilteredCount })
        : t('{shown} of {total} issues', {
            shown: section.totalCount,
            total: section.unfilteredCount,
          });

    return (
      <TaskBacklogSection
        key={section.key}
        title={
          sprint === undefined ? t('Backlog') : (sprint.name ?? t('Sprint'))
        }
        description={
          sprint === undefined ? t('Issues not in any sprint') : undefined
        }
        dateRange={
          sprint === undefined
            ? null
            : formatSprintDateRange({
                startDate: sprint.startDate,
                endDate: sprint.endDate,
              })
        }
        isActive={sprint?.state === 'ACTIVE'}
        isCompact={isMobile}
        issueCountLabel={issueCountLabel}
        storyPointTotal={section.storyPointTotal}
        isCollapsed={collapsedKeys.includes(section.key)}
        onToggleCollapsed={() => toggleCollapsed(section.key)}
        action={renderSectionAction(sprint, section)}
        menu={renderSectionMenu(sprint, section)}
        isDragActive={draggingIssueId !== null}
        isEndDropTarget={isEndDropTarget}
        onDragOverEnd={() =>
          setDropTarget({ sectionKey: section.key, beforeIssueId: null })
        }
        onDropEnd={() =>
          void dropIssue({ sectionKey: section.key, beforeIssueId: null })
        }
        // Empty for real, not just filtered down to nothing.
        isEmpty={section.unfilteredCount === 0}
        footer={
          <>
            {section.hasNextPage && (
              <button
                type="button"
                disabled={loadingSectionKeys.includes(section.key)}
                onClick={() => void loadMoreSection(section)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: TASK_TOKENS.textTertiary,
                  cursor: 'pointer',
                  fontFamily: TASK_TOKENS.fontFamily,
                  fontSize: 12,
                  padding: '8px 0',
                }}
              >
                {loadingSectionKeys.includes(section.key)
                  ? t('Loading…')
                  : t('{count} more issues', { count: remainingCount })}
              </button>
            )}
            {renderComposer(section.key)}
          </>
        }
      >
        {section.issues.map((issue) => {
          const epic =
            typeof issue.epicId === 'string'
              ? epicsById.get(issue.epicId)
              : undefined;
          const status =
            typeof issue.statusId === 'string'
              ? statusesById.get(issue.statusId)
              : undefined;

          return (
            <TaskBacklogRow
              key={issue.id}
              issue={issue}
              epicName={epic === undefined ? null : (epic.name ?? null)}
              epicColor={epic === undefined ? null : readEpicColor(epic)}
              statusName={status === undefined ? null : (status.name ?? null)}
              statusColor={status?.color ?? null}
              isDone={doneStatusIds.has(issue.statusId ?? '')}
              assigneeName={
                typeof issue.assigneeId === 'string'
                  ? readMemberName(membersById, issue.assigneeId, t('Unknown'))
                  : null
              }
              assigneeAvatarUrl={
                membersById.get(issue.assigneeId ?? '')?.avatarUrl
              }
              subtaskCount={backlog.subtaskCountByIssueId[issue.id] ?? 0}
              isSelected={selectedIssueId === issue.id}
              isDragging={draggingIssueId === issue.id}
              isDropTarget={
                dropTarget?.sectionKey === section.key &&
                dropTarget.beforeIssueId === issue.id &&
                draggingIssueId !== issue.id
              }
              canDrag={canWrite}
              isCompact={isMobile}
              onOpen={() => setSelectedIssueId(issue.id)}
              onDragStartRow={() => setDraggingIssueId(issue.id)}
              onDragEndRow={endDrag}
              onDragOverRow={() =>
                setDropTarget({
                  sectionKey: section.key,
                  beforeIssueId: issue.id,
                })
              }
              onDropRow={() =>
                void dropIssue({
                  sectionKey: section.key,
                  beforeIssueId: issue.id,
                })
              }
            />
          );
        })}
      </TaskBacklogSection>
    );
  };

  const sprintSections = backlog.sections.filter(
    (section) => section.sprintId !== null,
  );
  const backlogSection = backlog.sections.find(
    (section) => section.sprintId === null,
  );
  const futureSprints = backlog.sprints.filter(
    (sprint) => sprint.state !== 'ACTIVE',
  );

  return (
    <>
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
          overflowY: 'auto',
          ...TASK_THIN_SCROLLBAR_STYLE,
          padding: `0 ${inset.right}px ${inset.right}px ${inset.left}px`,
        }}
      >
        {sprintSections.map(renderSection)}
        {canWrite && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TaskButton onClick={() => void createSprint()}>
              {t('Create sprint')}
            </TaskButton>
          </div>
        )}
        {backlogSection !== undefined && renderSection(backlogSection)}
      </div>

      {sprintDialog !== null && (
        <twenty-overlay>
          <TaskSprintDialog
            mode={sprintDialog.mode}
            sprint={sprintDialog.sprint}
            issueCount={sprintDialog.issueCount}
            onClose={() => setSprintDialog(null)}
            onSaved={closeDialogsAndRefresh}
          />
        </twenty-overlay>
      )}

      {completingSprint !== null && (
        <twenty-overlay>
          <TaskCompleteSprintDialog
            sprint={completingSprint}
            futureSprints={futureSprints}
            onClose={() => setCompletingSprint(null)}
            onCompleted={closeDialogsAndRefresh}
          />
        </twenty-overlay>
      )}

      {selectedIssueId !== null && (
        // Without onClose, as on the board: see TaskBoardDetailFrame.
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
