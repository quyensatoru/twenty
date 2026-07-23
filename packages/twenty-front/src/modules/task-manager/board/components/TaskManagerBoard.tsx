import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DragDropContext } from '@hello-pangea/dnd';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { ObjectOptionsDropdown } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdown';
import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { TaskManagerBoardColumn } from '@/task-manager/board/components/TaskManagerBoardColumn';
import { TaskManagerTopBar } from '@/task-manager/components/TaskManagerTopBar';
import { useRecordDragToGroupReorder } from '@/task-manager/hooks/useRecordDragToGroupReorder';
import { useTaskManagerIssues } from '@/task-manager/hooks/useTaskManagerIssues';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { ViewType } from '@/views/types/ViewType';

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const StyledBoard = styled.div`
  display: flex;
  flex: 1;
  gap: ${themeCssVariables.spacing['4']};
  overflow-x: auto;
  padding: ${themeCssVariables.spacing['4']};
`;

// Rendered separately on the card (title/key in the card header, status by
// being the column itself), or too large for a compact card (description).
const CARD_EXCLUDED_FIELD_NAMES = new Set([
  'title',
  'issueKey',
  'status',
  'description',
]);

export const TaskManagerBoard = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') ?? undefined;

  const { objectMetadataItem, recordIndexId } = useRecordIndexContextOrThrow();
  const { issues } = useTaskManagerIssues({ projectId });

  const visibleRecordFields = useAtomComponentSelectorValue(
    visibleRecordFieldsComponentSelector,
    recordIndexId,
  );

  const visibleOptionalFieldMetadataItems = useMemo(() => {
    return visibleRecordFields
      .map((recordField) =>
        objectMetadataItem.fields.find(
          (field) => field.id === recordField.fieldMetadataItemId,
        ),
      )
      .filter(
        (fieldMetadataItem): fieldMetadataItem is FieldMetadataItem =>
          fieldMetadataItem !== undefined &&
          !CARD_EXCLUDED_FIELD_NAMES.has(fieldMetadataItem.name),
      );
  }, [visibleRecordFields, objectMetadataItem.fields]);

  const statusField = objectMetadataItem.fields.find(
    (field) => field.name === 'status',
  );

  const columns = useMemo(
    () =>
      (statusField?.options ?? [])
        .slice()
        .sort((a, b) => a.position - b.position),
    [statusField],
  );

  const issuesByStatus = useMemo(() => {
    const grouped = new Map<string, typeof issues>();

    for (const column of columns) {
      grouped.set(
        column.value,
        issues
          .filter((issue) => issue.status === column.value)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      );
    }

    return grouped;
  }, [issues, columns]);

  const { handleDragEnd } = useRecordDragToGroupReorder({
    objectNameSingular: 'issue',
    groupFieldName: 'status',
    recordsByGroup: issuesByStatus,
  });

  return (
    <StyledPage>
      <TaskManagerTopBar
        rightSlot={
          <ObjectOptionsDropdown
            objectMetadataItem={objectMetadataItem}
            recordIndexId={recordIndexId}
            // ponytail: ViewType.KANBAN routes field show/hide through
            // useObjectOptionsForBoard, which reads/writes the legacy global
            // recordIndexFieldDefinitionsState atom that only the real
            // RecordBoard component populates. Our hand-rolled board never
            // mounts RecordBoard, so that atom stays empty and hidden fields
            // could never be shown again. TABLE routes through
            // changeRecordFieldVisibility instead, which is scoped correctly
            // by recordIndexId and works both ways.
            viewType={ViewType.TABLE}
          />
        }
      />
      <DragDropContext onDragEnd={handleDragEnd}>
        <StyledBoard>
          {columns.map((column) => (
            <TaskManagerBoardColumn
              key={column.value}
              columnId={column.value}
              title={column.label}
              color={column.color}
              issues={issuesByStatus.get(column.value) ?? []}
              objectMetadataItem={objectMetadataItem}
              visibleOptionalFieldMetadataItems={
                visibleOptionalFieldMetadataItems
              }
            />
          ))}
        </StyledBoard>
      </DragDropContext>
    </StyledPage>
  );
};
