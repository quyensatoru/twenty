import { useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { t } from 'twenty-sdk/front-component';

import { ROADMAP_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type IssueStatusRow } from '../types/task-manager-rows';
import { RoadmapEpicCard } from './components/roadmap-epic-card';
import { TaskMessage } from './components/task-message';
import { TaskPageHeader } from './components/task-page-header';
import { TaskSelect } from './components/task-select';
import { TASK_TOKENS } from './components/task-tokens';
import { useRoadmapData } from './hooks/use-roadmap-data';
import { openIssue } from './utils/open-issue.util';

const Roadmap = () => {
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const { data, isLoading, loadError } = useRoadmapData({ projectId });

  const issueStatusById = useMemo(
    () =>
      new Map<string, IssueStatusRow>(
        data.issueStatuses.map((issueStatus) => [issueStatus.id, issueStatus]),
      ),
    [data.issueStatuses],
  );

  const doneStatusIds = useMemo(
    () =>
      data.issueStatuses
        .filter((issueStatus) => issueStatus.category === 'DONE')
        .map((issueStatus) => issueStatus.id),
    [data.issueStatuses],
  );

  // Sub-tasks roll up under their parent, so only top-level issues without an
  // epic get their own section.
  const issuesWithoutEpic = useMemo(
    () => data.issues.filter((issue) => !issue.epicId && !issue.parentId),
    [data.issues],
  );

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

    if (data.epics.length === 0 && issuesWithoutEpic.length === 0) {
      return <TaskMessage text={t('No issues yet.')} />;
    }

    return (
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
        {data.epics.map((epic) => (
          <RoadmapEpicCard
            key={epic.id}
            title={epic.name ?? ''}
            issues={data.issues.filter((issue) => issue.epicId === epic.id)}
            issueStatusById={issueStatusById}
            doneStatusIds={doneStatusIds}
            onOpenIssue={openIssue}
          />
        ))}
        {issuesWithoutEpic.length > 0 && (
          <RoadmapEpicCard
            title={t('No epic')}
            issues={issuesWithoutEpic}
            issueStatusById={issueStatusById}
            doneStatusIds={doneStatusIds}
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
      <TaskPageHeader title={t('Roadmap')}>
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
  universalIdentifier: ROADMAP_FRONT_COMPONENT_UID,
  name: 'task-manager-roadmap',
  description:
    'Roadmap: epics with their completion progress and their dated issues.',
  component: Roadmap,
});
