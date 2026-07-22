import { ProjectIssueCard } from '@/project-management/components/board/ProjectIssueCard';
import { type ProjectIssue } from '@/project-management/hooks/useProjectIssues';
import { getCssCompatibleDraggableProps } from '@/ui/layout/draggable-list/utils/getCssCompatibleDraggableProps';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledSection = styled.div`
  margin-bottom: ${themeCssVariables.spacing[4]};
`;

const StyledSectionHeader = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const StyledSectionTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledSectionCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledDropZone = styled.div`
  min-height: 40px;
`;

const StyledEmptyDropZone = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

type ProjectBacklogSprintSectionProps = {
  droppableId: string;
  title: string;
  issues: ProjectIssue[];
};

export const ProjectBacklogSprintSection = ({
  droppableId,
  title,
  issues,
}: ProjectBacklogSprintSectionProps) => {
  return (
    <StyledSection>
      <StyledSectionHeader>
        <StyledSectionTitle>{title}</StyledSectionTitle>
        <StyledSectionCount>{issues.length} issues</StyledSectionCount>
      </StyledSectionHeader>
      <Droppable droppableId={droppableId}>
        {(droppableProvided) => (
          <StyledDropZone
            ref={droppableProvided.innerRef}
            // oxlint-disable-next-line react/jsx-props-no-spreading
            {...droppableProvided.droppableProps}
          >
            {issues.length === 0 && (
              <StyledEmptyDropZone>Drop issues here</StyledEmptyDropZone>
            )}
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
          </StyledDropZone>
        )}
      </Droppable>
    </StyledSection>
  );
};
