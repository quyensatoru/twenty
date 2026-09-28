import { useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { t } from 'twenty-sdk/front-component';

import { UPDATE_ISSUE_ROUTE_PATH } from '../constants/route-paths';
import { BOARD_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type IssueRow } from '../types/task-manager-rows';
import { BoardColumn } from './components/board-column';
import { TaskMessage } from './components/task-message';
import { TaskPageHeader } from './components/task-page-header';
import { TaskSelect } from './components/task-select';
import { TASK_TOKENS } from './components/task-tokens';
import { useBoardData } from './hooks/use-board-data';
import { computeDropPosition } from './utils/compute-drop-position.util';
import {
  groupIssuesBy,
  UNGROUPED_GROUP_KEY,
} from './utils/group-issues-by.util';
import { openIssue } from './utils/open-issue.util';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';

const NO_SPRINT_VALUE = '__all__';

const Board = () => {
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [sprintSelection, setSprintSelection] = useState<string | undefined>(
    undefined,
  );
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const { data, isLoading, loadError, reload, setData } = useBoardData({
    projectId,
    sprintId:
      sprintSelection === undefined
        ? undefined
        : sprintSelection === NO_SPRINT_VALUE
          ? null
          : sprintSelection,
  });

  const issuesByStatus = useMemo(
    () =>
      groupIssuesBy({
        issues: data.issues,
        groupKey: 'statusId',
        groupIds: data.issueStatuses.map((issueStatus) => issueStatus.id),
      }),
    [data.issues, data.issueStatuses],
  );

  const moveIssue = async ({
    issueId,
    statusId,
    targetIndex,
  }: {
    issueId: string;
    statusId: string | null;
    targetIndex: number;
  }) => {
    const columnIssues = issuesByStatus.get(statusId ?? UNGROUPED_GROUP_KEY) ?? [];
    const withoutMoved = columnIssues.filter((issue) => issue.id !== issueId);
    const movedFromSameColumn = columnIssues.length !== withoutMoved.length;
    const adjustedIndex =
      movedFromSameColumn &&
      columnIssues.findIndex((issue) => issue.id === issueId) < targetIndex
        ? targetIndex - 1
        : targetIndex;

    const position = computeDropPosition({
      positions: withoutMoved.map((issue) => issue.position ?? 0),
      targetIndex: adjustedIndex,
    });

    // Optimistic: the card follows the cursor's drop immediately, and a failed
    // write reloads the server's truth rather than leaving the board lying.
    setData((previous) => ({
      ...previous,
      issues: previous.issues.map((issue) =>
        issue.id === issueId ? { ...issue, statusId, position } : issue,
      ),
    }));

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { statusId, position },
      });
      setMoveError(null);
    } catch (error) {
      setMoveError(readErrorText(error));
      await reload();
    }
  };

  const handleDropIssue = (statusId: string | null, targetIndex: number) => {
    const issueId = draggingIssueId;

    setDraggingIssueId(null);

    if (issueId === null) {
      return;
    }

    void moveIssue({ issueId, statusId, targetIndex });
  };

  const renderBody = () => {
    if (isLoading) {
      return <TaskMessage text={t('Loading…')} />;
    }

    if (loadError !== null) {
      return <TaskMessage text={loadError} tone="danger" />;
    }

    if (data.project === null) {
      return <TaskMessage text={t('No project is available to you yet.')} />;
    }

    const unassigned: IssueRow[] =
      issuesByStatus.get(UNGROUPED_GROUP_KEY) ?? [];

    return (
      <div
        style={{
          display: 'flex',
          flex: 1,
          gap: 12,
          minHeight: 0,
          overflowX: 'auto',
          padding: 16,
        }}
      >
        {data.issueStatuses.map((issueStatus) => (
          <BoardColumn
            key={issueStatus.id}
            issueStatus={issueStatus}
            title={issueStatus.name ?? ''}
            issues={issuesByStatus.get(issueStatus.id) ?? []}
            draggingIssueId={draggingIssueId}
            onDragStartIssue={setDraggingIssueId}
            onDragEndIssue={() => setDraggingIssueId(null)}
            onDropIssue={(targetIndex) =>
              handleDropIssue(issueStatus.id, targetIndex)
            }
            onOpenIssue={openIssue}
          />
        ))}
        {unassigned.length > 0 && (
          <BoardColumn
            issueStatus={null}
            title={t('No status')}
            issues={unassigned}
            draggingIssueId={draggingIssueId}
            onDragStartIssue={setDraggingIssueId}
            onDragEndIssue={() => setDraggingIssueId(null)}
            onDropIssue={(targetIndex) => handleDropIssue(null, targetIndex)}
            onOpenIssue={openIssue}
          />
        )}
      </div>
    );
  };

  return (
    <main
      style={{
        background: TASK_TOKENS.background,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        height: '100%',
        width: '100%',
      }}
    >
      <TaskPageHeader
        title={t('Board')}
        subtitle={moveError ?? undefined}
      >
        {data.projects.length > 0 && (
          <TaskSelect
            ariaLabel={t('Project')}
            value={data.project?.id ?? ''}
            options={data.projects.map((project) => ({
              value: project.id,
              label: project.name ?? project.key ?? project.id,
            }))}
            onChange={(nextProjectId) => {
              setProjectId(nextProjectId);
              setSprintSelection(undefined);
            }}
          />
        )}
        {data.sprints.length > 0 && (
          <TaskSelect
            ariaLabel={t('Sprint')}
            value={data.sprintId ?? NO_SPRINT_VALUE}
            options={[
              { value: NO_SPRINT_VALUE, label: t('All issues') },
              ...data.sprints.map((sprint) => ({
                value: sprint.id,
                label: sprint.name ?? sprint.id,
              })),
            ]}
            onChange={setSprintSelection}
          />
        )}
      </TaskPageHeader>
      {renderBody()}
    </main>
  );
};

export default defineFrontComponent({
  universalIdentifier: BOARD_FRONT_COMPONENT_UID,
  name: 'task-manager-board',
  description:
    'Kanban board: issues by project status, moved with native drag and drop.',
  component: Board,
});
