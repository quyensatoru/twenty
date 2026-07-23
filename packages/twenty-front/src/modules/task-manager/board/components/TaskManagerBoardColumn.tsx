import { Droppable } from '@hello-pangea/dnd';
import { styled } from '@linaria/react';
import { ColorSample } from 'twenty-ui/data-display';
import { type ThemeColor } from 'twenty-ui/theme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { TaskManagerBoardCard } from '@/task-manager/board/components/TaskManagerBoardCard';

const StyledColumn = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 280px;
`;

const StyledColumnHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['2']};
  padding: ${themeCssVariables.spacing['2']};
`;

const StyledColumnTitle = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  text-transform: uppercase;
`;

const StyledColumnCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledDropZone = styled.div<{ isDraggingOver: boolean }>`
  background: ${({ isDraggingOver }) =>
    isDraggingOver ? themeCssVariables.background.tertiary : 'transparent'};
  flex: 1;
  min-height: 40px;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing['1']} ${themeCssVariables.spacing['2']};
`;

type TaskManagerBoardColumnProps = {
  columnId: string;
  title: string;
  color: ThemeColor;
  issues: ObjectRecord[];
  objectMetadataItem: EnrichedObjectMetadataItem;
  visibleOptionalFieldMetadataItems: FieldMetadataItem[];
};

export const TaskManagerBoardColumn = ({
  columnId,
  title,
  color,
  issues,
  objectMetadataItem,
  visibleOptionalFieldMetadataItems,
}: TaskManagerBoardColumnProps) => {
  return (
    <StyledColumn>
      <StyledColumnHeader>
        <ColorSample colorName={color} variant="circle" />
        <StyledColumnTitle>{title}</StyledColumnTitle>
        <StyledColumnCount>{issues.length}</StyledColumnCount>
      </StyledColumnHeader>
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <StyledDropZone
            ref={provided.innerRef}
            // oxlint-disable-next-line react/jsx-props-no-spreading
            {...provided.droppableProps}
            isDraggingOver={snapshot.isDraggingOver}
          >
            {issues.map((issue, index) => (
              <TaskManagerBoardCard
                key={issue.id}
                issue={issue}
                index={index}
                objectMetadataItem={objectMetadataItem}
                visibleOptionalFieldMetadataItems={
                  visibleOptionalFieldMetadataItems
                }
              />
            ))}
            {provided.placeholder}
          </StyledDropZone>
        )}
      </Droppable>
    </StyledColumn>
  );
};
