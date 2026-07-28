import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { ViewFilterOperand } from 'twenty-shared/types';

import { ObjectOptionsDropdown } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdown';
import { RecordBoardContainer } from '@/object-record/record-board/components/RecordBoardContainer';
import { useRemoveRecordFilter } from '@/object-record/record-filter/hooks/useRemoveRecordFilter';
import { useUpsertRecordFilter } from '@/object-record/record-filter/hooks/useUpsertRecordFilter';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { TaskManagerTopBar } from '@/task-manager/components/TaskManagerTopBar';
import { ViewType } from '@/views/types/ViewType';

const TASK_MANAGER_BOARD_PROJECT_FILTER_ID =
  'task-manager-board-project-filter';

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const StyledBoardContainer = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`;

export const TaskManagerBoard = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') ?? undefined;

  const { objectMetadataItem, recordIndexId, objectNameSingular } =
    useRecordIndexContextOrThrow();

  const { upsertRecordFilter } = useUpsertRecordFilter(recordIndexId);
  const { removeRecordFilter } = useRemoveRecordFilter(recordIndexId);

  useEffect(() => {
    const projectFieldMetadataItem = objectMetadataItem.fields.find(
      (field) => field.name === 'project',
    );

    if (!projectFieldMetadataItem) {
      return;
    }

    if (projectId) {
      upsertRecordFilter({
        id: TASK_MANAGER_BOARD_PROJECT_FILTER_ID,
        fieldMetadataId: projectFieldMetadataItem.id,
        type: 'RELATION',
        operand: ViewFilterOperand.IS,
        value: JSON.stringify({ selectedRecordIds: [projectId] }),
        displayValue: '',
        label: t`Project`,
      });
    } else {
      removeRecordFilter({
        recordFilterId: TASK_MANAGER_BOARD_PROJECT_FILTER_ID,
      });
    }
  }, [
    projectId,
    objectMetadataItem.fields,
    upsertRecordFilter,
    removeRecordFilter,
  ]);

  return (
    <StyledPage>
      <TaskManagerTopBar
        rightSlot={
          <ObjectOptionsDropdown
            objectMetadataItem={objectMetadataItem}
            recordIndexId={recordIndexId}
            viewType={ViewType.KANBAN}
          />
        }
      />
      <StyledBoardContainer>
        <RecordBoardContainer
          recordBoardId={recordIndexId}
          viewBarId={recordIndexId}
          objectNameSingular={objectNameSingular}
        />
      </StyledBoardContainer>
    </StyledPage>
  );
};
