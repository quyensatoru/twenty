import { ProjectIssueCard } from '@/project-management/components/board/ProjectIssueCard';
import { type ProjectIssue } from '@/project-management/hooks/useProjectIssues';
import { getCssCompatibleDraggableProps } from '@/ui/layout/draggable-list/utils/getCssCompatibleDraggableProps';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledColumn = styled.div`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 240px;
`;

const StyledColumnHeader = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledCardsContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[2]};
`;

type ProjectBoardColumnProps = {
  columnId: string;
  label: string;
  issues: ProjectIssue[];
};

export const ProjectBoardColumn = ({
  columnId,
  label,
  issues,
}: ProjectBoardColumnProps) => {
  return (
    <StyledColumn>
      <StyledColumnHeader>
        {label} · {issues.length}
      </StyledColumnHeader>
      <Droppable droppableId={columnId}>
        {(droppableProvided) => (
          <StyledCardsContainer
            ref={droppableProvided.innerRef}
            // oxlint-disable-next-line react/jsx-props-no-spreading
            {...droppableProvided.droppableProps}
          >
            {issues.map((issue, index) => (
              <Draggable key={issue.id} draggableId={issue.id} index={index}>
                {(draggableProvided) => (
                  <div
                    ref={draggableProvided.innerRef}
                    // oxlint-disable-next-line react/jsx-props-no-spreading
                    {...draggableProvided.dragHandleProps}
                    // oxlint-disable-next-line react/jsx-props-no-spreading
                    {...getCssCompatibleDraggableProps(
                      draggableProvided.draggableProps,
                    )}
                  >
                    <ProjectIssueCard issue={issue} />
                  </div>
                )}
              </Draggable>
            ))}
            {droppableProvided.placeholder}
          </StyledCardsContainer>
        )}
      </Droppable>
    </StyledColumn>
  );
};
