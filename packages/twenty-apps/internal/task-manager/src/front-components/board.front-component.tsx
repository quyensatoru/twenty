import { useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { t } from 'twenty-sdk/front-component';

import {
  CREATE_ISSUE_ROUTE_PATH,
  UPDATE_ISSUE_ROUTE_PATH,
} from '../constants/route-paths';
import { BOARD_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type IssueRow } from '../types/task-manager-rows';
import { matchIssueSearch } from './utils/match-issue-search.util';
import { BoardColumn } from './components/board-column';
import { NewIssueComposer } from './components/new-issue-composer';
import { TaskFieldVisibilityMenu } from './components/task-field-visibility-menu';
import { TaskMessage } from './components/task-message';
import { TaskPageHeader } from './components/task-page-header';
import { TaskSearchInput } from './components/task-search-input';
import { TaskSelect } from './components/task-select';
import { TASK_TOKENS } from './components/task-tokens';
import { type MemberRow } from './hooks/use-issue-detail';
import { useBoardData } from './hooks/use-board-data';
import { useVisibleIssueCardFields } from './hooks/use-visible-issue-card-fields';
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
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const { visibleFields, toggleField } = useVisibleIssueCardFields();

  const { data, isLoading, loadError, reload, setData } = useBoardData({
    projectId,
    sprintId:
      sprintSelection === undefined
        ? undefined
        : sprintSelection === NO_SPRINT_VALUE
          ? null
          : sprintSelection,
  });

  const visibleIssues = useMemo(
    () => data.issues.filter((issue) => matchIssueSearch(issue, search)),
    [data.issues, search],
  );

  const membersById = useMemo(
    () => new Map<string, MemberRow>(data.members.map((member) => [member.id, member])),
    [data.members],
  );

  const issuesByStatus = useMemo(
    () =>
      groupIssuesBy({
        issues: visibleIssues,
        groupKey: 'statusId',
        groupIds: data.issueStatuses.map((issueStatus) => issueStatus.id),
      }),
    [visibleIssues, data.issueStatuses],
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

  const createIssue = async (title: string) => {
    const projectId = data.project?.id;

    if (projectId === undefined) {
      return;
    }

    setIsCreating(true);

    try {
      await postAppRoute(CREATE_ISSUE_ROUTE_PATH, {
        projectId,
        data: {
          title,
          // New work lands in the first column and, when a sprint is being
          // viewed, in that sprint — which is where the person adding it is
          // looking.
          ...(data.issueStatuses[0] === undefined
            ? {}
            : { statusId: data.issueStatuses[0].id }),
          ...(data.sprintId === null ? {} : { sprintId: data.sprintId }),
        },
      });
      setMoveError(null);
      await reload();
    } catch (error) {
      setMoveError(readErrorText(error));
    } finally {
      setIsCreating(false);
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
            visibleFields={visibleFields}
            membersById={membersById}
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
            visibleFields={visibleFields}
            membersById={membersById}
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
        <TaskSearchInput
          ariaLabel={t('Search issues')}
          clearLabel={t('Clear search')}
          placeholder={t('Search by key or title')}
          value={search}
          onChange={setSearch}
        />
        <TaskFieldVisibilityMenu
          visibleFields={visibleFields}
          onToggleField={toggleField}
        />
        {data.project !== null && (
          <NewIssueComposer
            isBusy={isCreating}
            onCreate={(title) => void createIssue(title)}
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
