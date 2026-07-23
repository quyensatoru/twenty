import { useNavigate } from 'react-router-dom';

import { styled } from '@linaria/react';
import { Draggable } from '@hello-pangea/dnd';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { RecordFieldsScopeContextProvider } from '@/object-record/record-field-list/contexts/RecordFieldsScopeContext';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getCssCompatibleDraggableProps } from '@/ui/layout/draggable-list/utils/getCssCompatibleDraggableProps';
import { TaskManagerFieldCell } from '@/task-manager/components/TaskManagerFieldCell';

const StyledCard = styled.div<{ isDragging: boolean }>`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-shadow: ${({ isDragging }) =>
    isDragging ? themeCssVariables.boxShadow.strong : 'none'};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['1.5']};
  margin-bottom: ${themeCssVariables.spacing['2']};
  padding: ${themeCssVariables.spacing['2']};
`;

const StyledIssueKey = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledBadges = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing['1']};
`;

type TaskManagerBoardCardProps = {
  issue: ObjectRecord;
  index: number;
  objectMetadataItem: EnrichedObjectMetadataItem;
  visibleOptionalFieldMetadataItems: FieldMetadataItem[];
};

export const TaskManagerBoardCard = ({
  issue,
  index,
  objectMetadataItem,
  visibleOptionalFieldMetadataItems,
}: TaskManagerBoardCardProps) => {
  const goToIssuePage = useNavigate();

  return (
    <Draggable draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <StyledCard
          ref={provided.innerRef}
          // oxlint-disable-next-line react/jsx-props-no-spreading
          {...getCssCompatibleDraggableProps(provided.draggableProps)}
          // oxlint-disable-next-line react/jsx-props-no-spreading
          {...provided.dragHandleProps}
          isDragging={snapshot.isDragging}
          onClick={() => goToIssuePage(`/task-manager/issue/${issue.id}`)}
        >
          <StyledIssueKey>{issue.issueKey}</StyledIssueKey>
          <StyledTitle>{issue.title}</StyledTitle>
          {visibleOptionalFieldMetadataItems.length > 0 && (
            <RecordFieldsScopeContextProvider
              value={{ scopeInstanceId: `task-manager-board-card-${issue.id}` }}
            >
              <StyledBadges>
                {visibleOptionalFieldMetadataItems.map((fieldMetadataItem) => (
                  <TaskManagerFieldCell
                    key={fieldMetadataItem.id}
                    recordId={issue.id}
                    fieldMetadataItem={fieldMetadataItem}
                    objectMetadataItem={objectMetadataItem}
                    instanceIdPrefix="task-manager-board-card"
                    showLabel={false}
                    readOnly
                  />
                ))}
              </StyledBadges>
            </RecordFieldsScopeContextProvider>
          )}
        </StyledCard>
      )}
    </Draggable>
  );
};
