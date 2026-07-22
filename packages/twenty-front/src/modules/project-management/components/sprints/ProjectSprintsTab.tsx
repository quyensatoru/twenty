import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { ProjectSprintRow } from '@/project-management/components/sprints/ProjectSprintRow';
import { ProjectViewProvider } from '@/project-management/components/ProjectViewProvider';
import { ProjectViewToolbar } from '@/project-management/components/ProjectViewToolbar';
import { useProjectIssues } from '@/project-management/hooks/useProjectIssues';
import { useProjectSprintsForView } from '@/project-management/hooks/useProjectSprintsForView';
import { useProjectTabView } from '@/project-management/hooks/useProjectTabView';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]};
`;

type ProjectSprintsTabProps = {
  projectId: string;
  isReadOnly: boolean;
};

export const ProjectSprintsTab = ({
  projectId,
  isReadOnly,
}: ProjectSprintsTabProps) => {
  const { viewId, loading } = useProjectTabView('sprints', 'sprint', projectId);
  const recordIndexId = `pm-sprints-sprint-${projectId}`;

  if (loading || !viewId) {
    return <StyledEmptyState>Loading sprints…</StyledEmptyState>;
  }

  return (
    <ProjectViewProvider
      objectNameSingular="sprint"
      viewId={viewId}
      recordIndexId={recordIndexId}
    >
      <ProjectViewToolbar />
      <ProjectSprintsTabContent projectId={projectId} isReadOnly={isReadOnly} />
    </ProjectViewProvider>
  );
};

type ProjectSprintsTabContentProps = ProjectSprintsTabProps;

const ProjectSprintsTabContent = ({
  projectId,
  isReadOnly,
}: ProjectSprintsTabContentProps) => {
  const recordIndexId = `pm-sprints-sprint-${projectId}`;
  const { sprints } = useProjectSprintsForView(projectId, recordIndexId);
  const { issues } = useProjectIssues(projectId);
  const { updateOneRecord } = useUpdateOneRecord();

  const handleStart = (sprintId: string) => {
    void updateOneRecord({
      objectNameSingular: 'sprint',
      idToUpdate: sprintId,
      updateOneRecordInput: { status: 'ACTIVE' },
    });
  };

  // ponytail: no single-active-sprint guard here (server has none either) —
  // add a check if teams start hitting the two-active-sprints case in practice.
  const handleComplete = async (sprintId: string) => {
    await updateOneRecord({
      objectNameSingular: 'sprint',
      idToUpdate: sprintId,
      updateOneRecordInput: { status: 'COMPLETED' },
    });

    const unfinishedIssues = issues.filter(
      (issue) => issue.sprint?.id === sprintId && issue.status !== 'DONE',
    );

    await Promise.all(
      unfinishedIssues.map((issue) =>
        updateOneRecord({
          objectNameSingular: 'issue',
          idToUpdate: issue.id,
          updateOneRecordInput: { sprintId: null },
        }),
      ),
    );
  };

  if (sprints.length === 0) {
    return (
      <StyledEmptyState>
        No sprints created for this project yet.
      </StyledEmptyState>
    );
  }

  return (
    <StyledContainer>
      {sprints.map((sprint) => (
        <ProjectSprintRow
          key={sprint.id}
          sprint={sprint}
          issues={issues.filter((issue) => issue.sprint?.id === sprint.id)}
          isReadOnly={isReadOnly}
          onStart={() => handleStart(sprint.id)}
          onComplete={() => void handleComplete(sprint.id)}
        />
      ))}
    </StyledContainer>
  );
};
