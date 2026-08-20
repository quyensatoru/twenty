import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { RecordIndexCommandMenu } from '@/command-menu-item/components/RecordIndexCommandMenu';
import { ObjectOptionsDropdown } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdown';
import { RecordBoardContainer } from '@/object-record/record-board/components/RecordBoardContainer';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { TaskManagerTopBar } from '@/task-manager/components/TaskManagerTopBar';
import { ViewType } from '@/views/types/ViewType';

const StyledPage = styled.div`
  background-color: ${themeCssVariables.background.primary};
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
  // The Kanban view resolved in TaskManagerBoardPage already carries a
  // permanent `project` filter (seeded per-project on the server), so no
  // runtime filter injection is needed here anymore.
  const { objectMetadataItem, recordIndexId, objectNameSingular } =
    useRecordIndexContextOrThrow();

  return (
    <StyledPage>
      <TaskManagerTopBar
        rightSlot={
          <>
            <RecordIndexCommandMenu />
            <ObjectOptionsDropdown
              objectMetadataItem={objectMetadataItem}
              recordIndexId={recordIndexId}
              viewType={ViewType.KANBAN}
              dropdownId="task-manager-board-object-options-dropdown"
            />
          </>
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
