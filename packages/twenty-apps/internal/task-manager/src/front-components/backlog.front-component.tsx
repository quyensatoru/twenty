import { useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { t } from 'twenty-sdk/front-component';

import {
  COMPLETE_SPRINT_ROUTE_PATH,
  UPDATE_ISSUE_ROUTE_PATH,
  UPDATE_SPRINT_ROUTE_PATH,
} from '../constants/route-paths';
import { BACKLOG_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { matchIssueSearch } from './utils/match-issue-search.util';
import { BacklogSprintSection } from './components/backlog-sprint-section';
import { TaskButton } from './components/task-button';
import { TaskFieldVisibilityMenu } from './components/task-field-visibility-menu';
import { TaskMessage } from './components/task-message';
import { TaskPageHeader } from './components/task-page-header';
import { TaskSearchInput } from './components/task-search-input';
import { TaskSelect } from './components/task-select';
import { TASK_TOKENS } from './components/task-tokens';
import { useBacklogData } from './hooks/use-backlog-data';
import { type MemberRow } from './hooks/use-issue-detail';
import { useVisibleIssueCardFields } from './hooks/use-visible-issue-card-fields';
import { computeDropPosition } from './utils/compute-drop-position.util';
import {
  groupIssuesBy,
  UNGROUPED_GROUP_KEY,
} from './utils/group-issues-by.util';
import { openIssue } from './utils/open-issue.util';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';

const Backlog = () => {
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [search, setSearch] = useState('');
  const { visibleFields, toggleField } = useVisibleIssueCardFields();

  const { data, isLoading, loadError, reload, setData } = useBacklogData({
    projectId,
  });

  const openSprints = useMemo(
    () => data.sprints.filter((sprint) => sprint.state !== 'CLOSED'),
    [data.sprints],
  );

  const nextFutureSprintId = useMemo(
    () => openSprints.find((sprint) => sprint.state === 'FUTURE')?.id,
    [openSprints],
  );

  const visibleIssues = useMemo(
    () => data.issues.filter((issue) => matchIssueSearch(issue, search)),
    [data.issues, search],
  );

  const membersById = useMemo(
    () =>
      new Map<string, MemberRow>(data.members.map((member) => [member.id, member])),
    [data.members],
  );

  const issuesBySprint = useMemo(
    () =>
      groupIssuesBy({
        issues: visibleIssues,
        groupKey: 'sprintId',
        groupIds: openSprints.map((sprint) => sprint.id),
      }),
    [visibleIssues, openSprints],
  );

  const moveIssue = async ({
    issueId,
    sprintId,
    targetIndex,
  }: {
    issueId: string;
    sprintId: string | null;
    targetIndex: number;
  }) => {
    const sectionIssues =
      issuesBySprint.get(sprintId ?? UNGROUPED_GROUP_KEY) ?? [];
    const withoutMoved = sectionIssues.filter((issue) => issue.id !== issueId);
    const movedWithinSection = sectionIssues.length !== withoutMoved.length;
    const adjustedIndex =
      movedWithinSection &&
      sectionIssues.findIndex((issue) => issue.id === issueId) < targetIndex
        ? targetIndex - 1
        : targetIndex;

    const position = computeDropPosition({
      positions: withoutMoved.map((issue) => issue.position ?? 0),
      targetIndex: adjustedIndex,
    });

    setData((previous) => ({
      ...previous,
      issues: previous.issues.map((issue) =>
        issue.id === issueId ? { ...issue, sprintId, position } : issue,
      ),
    }));

    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { sprintId, position },
      });
      setActionError(null);
    } catch (error) {
      setActionError(readErrorText(error));
      await reload();
    }
  };

  const handleDropIssue = (sprintId: string | null, targetIndex: number) => {
    const issueId = draggingIssueId;

    setDraggingIssueId(null);

    if (issueId === null) {
      return;
    }

    void moveIssue({ issueId, sprintId, targetIndex });
  };

  const runSprintAction = async (action: () => Promise<unknown>) => {
    setIsActing(true);

    try {
      await action();
      setActionError(null);
      await reload();
    } catch (error) {
      setActionError(readErrorText(error));
    } finally {
      setIsActing(false);
    }
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

    return (
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
        {openSprints.map((sprint) => (
          <BacklogSprintSection
            key={sprint.id}
            sprint={sprint}
            title={sprint.name ?? ''}
            issues={issuesBySprint.get(sprint.id) ?? []}
            visibleFields={visibleFields}
            membersById={membersById}
            draggingIssueId={draggingIssueId}
            onDragStartIssue={setDraggingIssueId}
            onDragEndIssue={() => setDraggingIssueId(null)}
            onDropIssue={(targetIndex) =>
              handleDropIssue(sprint.id, targetIndex)
            }
            onOpenIssue={openIssue}
            actions={
              sprint.state === 'FUTURE' ? (
                <TaskButton
                  size="small"
                  isDisabled={isActing}
                  onClick={() =>
                    void runSprintAction(() =>
                      postAppRoute(UPDATE_SPRINT_ROUTE_PATH, {
                        sprintId: sprint.id,
                        data: {
                          state: 'ACTIVE',
                          startDate: new Date().toISOString(),
                        },
                      }),
                    )
                  }
                >
                  {t('Start sprint')}
                </TaskButton>
              ) : sprint.state === 'ACTIVE' ? (
                <TaskButton
                  size="small"
                  isDisabled={isActing}
                  onClick={() =>
                    void runSprintAction(() =>
                      postAppRoute(COMPLETE_SPRINT_ROUTE_PATH, {
                        sprintId: sprint.id,
                        // Unfinished issues roll into the next planned sprint,
                        // or back to the backlog when there is none.
                        targetSprintId:
                          nextFutureSprintId === sprint.id
                            ? null
                            : (nextFutureSprintId ?? null),
                      }),
                    )
                  }
                >
                  {t('Complete sprint')}
                </TaskButton>
              ) : undefined
            }
          />
        ))}
        <BacklogSprintSection
          title={t('Backlog')}
          issues={issuesBySprint.get(UNGROUPED_GROUP_KEY) ?? []}
          visibleFields={visibleFields}
          membersById={membersById}
          draggingIssueId={draggingIssueId}
          onDragStartIssue={setDraggingIssueId}
          onDragEndIssue={() => setDraggingIssueId(null)}
          onDropIssue={(targetIndex) => handleDropIssue(null, targetIndex)}
          onOpenIssue={openIssue}
        />
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
      <TaskPageHeader title={t('Backlog')} subtitle={actionError ?? undefined}>
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
        {data.projects.length > 0 && (
          <TaskSelect
            ariaLabel={t('Project')}
            value={data.project?.id ?? ''}
            options={data.projects.map((project) => ({
              value: project.id,
              label: project.name ?? project.key ?? project.id,
            }))}
            onChange={setProjectId}
          />
        )}
      </TaskPageHeader>
      {renderBody()}
    </main>
  );
};

export default defineFrontComponent({
  universalIdentifier: BACKLOG_FRONT_COMPONENT_UID,
  name: 'task-manager-backlog',
  description:
    'Backlog: sprints and unplanned issues, reordered and moved between sprints by drag and drop.',
  component: Backlog,
});
