import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { ProjectBacklogTab } from '@/project-management/components/backlog/ProjectBacklogTab';
import { ProjectBoardTab } from '@/project-management/components/board/ProjectBoardTab';
import { ProjectEpicsTab } from '@/project-management/components/epics/ProjectEpicsTab';
import { ProjectRoleTag } from '@/project-management/components/ProjectRoleTag';
import { ProjectSprintsTab } from '@/project-management/components/sprints/ProjectSprintsTab';
import { ProjectTimelogsTab } from '@/project-management/components/timelogs/ProjectTimelogsTab';
import { useCurrentProjectRole } from '@/project-management/hooks/useCurrentProjectRole';
import { TabList } from '@/ui/layout/tab-list/components/TabList';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  IconClock,
  IconFlag,
  IconFolder,
  IconLayoutKanban,
  IconListCheck,
  IconRocket,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const TABS = [
  { id: 'board', title: 'Board', Icon: IconLayoutKanban },
  { id: 'backlog', title: 'Backlog', Icon: IconListCheck },
  { id: 'sprints', title: 'Sprints', Icon: IconRocket },
  { id: 'epics', title: 'Epics', Icon: IconFlag },
  { id: 'timelogs', title: 'Timelogs', Icon: IconClock },
];

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTabPanel = styled.div`
  flex: 1;
  min-height: 0;
`;

type ProjectRecord = {
  __typename: string;
  id: string;
  name: string;
  key: string;
};

export const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTabId, setActiveTabId] = useState<string>(TABS[0].id);

  const { record: project, loading: projectLoading } =
    useFindOneRecord<ProjectRecord>({
      objectNameSingular: 'project',
      objectRecordId: projectId,
      recordGqlFields: { id: true, name: true, key: true },
      skip: !projectId,
    });

  const { role, loading: roleLoading } = useCurrentProjectRole(projectId);

  if (!projectId) {
    return null;
  }

  if (!projectLoading && !roleLoading && !role) {
    return (
      <PageCardLayout header={<PageHeader title="Project" Icon={IconFolder} />}>
        <StyledEmptyState>
          You don't have access to this project.
        </StyledEmptyState>
      </PageCardLayout>
    );
  }

  const isReadOnly = role === 'VIEWER';

  return (
    <PageCardLayout
      header={
        <PageHeader
          title={project ? `${project.name} (${project.key})` : ''}
          Icon={IconFolder}
        >
          {role && <ProjectRoleTag role={role} />}
        </PageHeader>
      }
      secondaryBar={
        <TabList
          tabs={TABS}
          componentInstanceId={`project-page-${projectId}`}
          onChangeTab={setActiveTabId}
        />
      }
    >
      <StyledTabPanel>
        {activeTabId === 'board' && (
          <ProjectBoardTab projectId={projectId} isReadOnly={isReadOnly} />
        )}
        {activeTabId === 'backlog' && (
          <ProjectBacklogTab projectId={projectId} isReadOnly={isReadOnly} />
        )}
        {activeTabId === 'sprints' && (
          <ProjectSprintsTab projectId={projectId} isReadOnly={isReadOnly} />
        )}
        {activeTabId === 'epics' && <ProjectEpicsTab projectId={projectId} />}
        {activeTabId === 'timelogs' && (
          <ProjectTimelogsTab projectId={projectId} isReadOnly={isReadOnly} />
        )}
      </StyledTabPanel>
    </PageCardLayout>
  );
};
