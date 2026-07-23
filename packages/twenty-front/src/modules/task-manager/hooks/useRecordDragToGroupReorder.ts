import { type DropResult } from '@hello-pangea/dnd';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useUpsertRecordsInStore } from '@/object-record/record-store/hooks/useUpsertRecordsInStore';
import { computeNewPositionOfDraggedRecord } from '@/object-record/utils/computeNewPositionOfDraggedRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

// Shared "drag a record card into a group column/section, persist the
// group field + a recomputed position" handler for the Kanban board
// (group field = status) and the Backlog (group field = sprintId).
export const useRecordDragToGroupReorder = ({
  objectNameSingular,
  groupFieldName,
  recordsByGroup,
}: {
  objectNameSingular: string;
  groupFieldName: string;
  recordsByGroup: Map<string, ObjectRecord[]>;
}) => {
  const { updateOneRecord } = useUpdateOneRecord();
  const { upsertRecordsInStore } = useUpsertRecordsInStore();

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;

    if (!destination) {
      return;
    }

    const destinationGroupValue =
      destination.droppableId === 'null' ? null : destination.droppableId;

    const destinationGroupRecords = (
      recordsByGroup.get(destination.droppableId) ?? []
    )
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    let newPosition: number;

    if (destinationGroupRecords.length === 0) {
      newPosition = 1;
    } else {
      const isDroppedAfterList =
        destination.index >= destinationGroupRecords.length;
      const targetRecord = isDroppedAfterList
        ? destinationGroupRecords[destinationGroupRecords.length - 1]
        : destinationGroupRecords[destination.index];

      newPosition = computeNewPositionOfDraggedRecord({
        arrayOfRecordsWithPosition: destinationGroupRecords.map((record) => ({
          id: record.id,
          position: record.position ?? 0,
        })),
        idOfItemToMove: draggableId,
        idOfTargetItem: targetRecord.id,
        isDroppedAfterList,
      });
    }

    const draggedRecord = [...recordsByGroup.values()]
      .flat()
      .find((record) => record.id === draggableId);

    if (draggedRecord) {
      upsertRecordsInStore({
        partialRecords: [
          {
            ...draggedRecord,
            [groupFieldName]: destinationGroupValue,
            position: newPosition,
          },
        ],
      });
    }

    await updateOneRecord({
      objectNameSingular,
      idToUpdate: draggableId,
      updateOneRecordInput: {
        [groupFieldName]: destinationGroupValue,
        position: newPosition,
      },
    });
  };

  return { handleDragEnd };
};
