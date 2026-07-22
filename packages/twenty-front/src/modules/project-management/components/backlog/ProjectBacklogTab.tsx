import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { ProjectBacklogSprintSection } from '@/project-management/components/backlog/ProjectBacklogSprintSection';
import { ProjectViewProvider } from '@/project-management/components/ProjectViewProvider';
import { ProjectViewToolbar } from '@/project-management/components/ProjectViewToolbar';
import { useProjectIssuesForView } from '@/project-management/hooks/useProjectIssuesForView';
import { useProjectSprints } from '@/project-management/hooks/useProjectSprints';
import { useProjectTabView } from '@/project-management/hooks/useProjectTabView';
import { DragDropContext, type OnDragEndResponder } from '@hello-pangea/dnd';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const BACKLOG_DROPPABLE_ID = 'backlog';

const StyledContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]};
`;

type ProjectBacklogTabProps = {
  projectId: string;
  isReadOnly: boolean;
};

export const ProjectBacklogTab = ({
  projectId,
  isReadOnly,
}: ProjectBacklogTabProps) => {
  const { viewId, loading } = useProjectTabView('backlog', 'issue', projectId);
  const recordIndexId = `pm-backlog-issue-${projectId}`;

  if (loading || !viewId) {
    return <StyledEmptyState>Loading backlog…</StyledEmptyState>;
  }

  return (
    <ProjectViewProvider
      objectNameSingular="issue"
      viewId={viewId}
      recordIndexId={recordIndexId}
    >
      <ProjectViewToolbar />
      <ProjectBacklogTabContent projectId={projectId} isReadOnly={isReadOnly} />
    </ProjectViewProvider>
  );
};

type ProjectBacklogTabContentProps = ProjectBacklogTabProps;

const ProjectBacklogTabContent = ({
  projectId,
  isReadOnly,
}: ProjectBacklogTabContentProps) => {
  const recordIndexId = `pm-backlog-issue-${projectId}`;
  const { issues } = useProjectIssuesForView(projectId, recordIndexId);
  const { sprints } = useProjectSprints(projectId);
  const { updateOneRecord } = useUpdateOneRecord();

  const activeSprints = sprints.filter(
    (sprint) => sprint.status !== 'COMPLETED',
  );

  const handleDragEnd: OnDragEndResponder = (result) => {
    if (
      isReadOnly ||
      !result.destination ||
      result.destination.droppableId === result.source.droppableId
    ) {
      return;
    }

    const destinationSprintId =
      result.destination.droppableId === BACKLOG_DROPPABLE_ID
        ? null
        : result.destination.droppableId;

    void updateOneRecord({
      objectNameSingular: 'issue',
      idToUpdate: result.draggableId,
      updateOneRecordInput: { sprintId: destinationSprintId },
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <StyledContainer>
        {activeSprints.map((sprint) => (
          <ProjectBacklogSprintSection
            key={sprint.id}
            droppableId={sprint.id}
            title={`${sprint.name}${sprint.status === 'ACTIVE' ? ' (Active)' : ''}`}
            issues={issues.filter((issue) => issue.sprint?.id === sprint.id)}
          />
        ))}
        <ProjectBacklogSprintSection
          droppableId={BACKLOG_DROPPABLE_ID}
          title="Backlog"
          issues={issues.filter((issue) => !issue.sprint)}
        />
      </StyledContainer>
    </DragDropContext>
  );
};
