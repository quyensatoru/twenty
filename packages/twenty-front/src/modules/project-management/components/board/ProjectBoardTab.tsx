import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { ProjectBoardColumn } from '@/project-management/components/board/ProjectBoardColumn';
import { ProjectViewProvider } from '@/project-management/components/ProjectViewProvider';
import { ProjectViewToolbar } from '@/project-management/components/ProjectViewToolbar';
import { useObjectSelectFieldOptions } from '@/project-management/hooks/useObjectSelectFieldOptions';
import { useProjectIssuesForView } from '@/project-management/hooks/useProjectIssuesForView';
import { useProjectSprints } from '@/project-management/hooks/useProjectSprints';
import { useProjectTabView } from '@/project-management/hooks/useProjectTabView';
import { DragDropContext, type OnDragEndResponder } from '@hello-pangea/dnd';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledBoard = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  height: 100%;
  overflow-x: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]};
`;

type ProjectBoardTabProps = {
  projectId: string;
  isReadOnly: boolean;
};

export const ProjectBoardTab = ({
  projectId,
  isReadOnly,
}: ProjectBoardTabProps) => {
  const { viewId, loading } = useProjectTabView('board', 'issue', projectId);
  const recordIndexId = `pm-board-issue-${projectId}`;

  if (loading || !viewId) {
    return <StyledEmptyState>Loading board…</StyledEmptyState>;
  }

  return (
    <ProjectViewProvider
      objectNameSingular="issue"
      viewId={viewId}
      recordIndexId={recordIndexId}
    >
      <ProjectViewToolbar />
      <ProjectBoardTabContent projectId={projectId} isReadOnly={isReadOnly} />
    </ProjectViewProvider>
  );
};

type ProjectBoardTabContentProps = ProjectBoardTabProps;

const ProjectBoardTabContent = ({
  projectId,
  isReadOnly,
}: ProjectBoardTabContentProps) => {
  const recordIndexId = `pm-board-issue-${projectId}`;
  const { issues } = useProjectIssuesForView(projectId, recordIndexId);
  const { sprints } = useProjectSprints(projectId);
  const { options: statusOptions } = useObjectSelectFieldOptions(
    'issue',
    'status',
  );
  const { updateOneRecord } = useUpdateOneRecord();

  const activeSprint = sprints.find((sprint) => sprint.status === 'ACTIVE');

  const boardIssues = activeSprint
    ? issues.filter((issue) => issue.sprint?.id === activeSprint.id)
    : [];

  const handleDragEnd: OnDragEndResponder = (result) => {
    if (
      isReadOnly ||
      !result.destination ||
      result.destination.droppableId === result.source.droppableId
    ) {
      return;
    }

    void updateOneRecord({
      objectNameSingular: 'issue',
      idToUpdate: result.draggableId,
      updateOneRecordInput: { status: result.destination.droppableId },
    });
  };

  if (!activeSprint) {
    return (
      <StyledEmptyState>
        No active sprint. Start a sprint from the Sprints tab to see issues on
        the board.
      </StyledEmptyState>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <StyledBoard>
        {statusOptions.map((option) => (
          <ProjectBoardColumn
            key={option.value}
            columnId={option.value}
            label={option.label}
            issues={boardIssues.filter(
              (issue) => issue.status === option.value,
            )}
          />
        ))}
      </StyledBoard>
    </DragDropContext>
  );
};
