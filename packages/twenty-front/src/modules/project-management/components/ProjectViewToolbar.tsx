import { ObjectFilterDropdownComponentInstanceContext } from '@/object-record/object-filter-dropdown/states/contexts/ObjectFilterDropdownComponentInstanceContext';
import { ObjectOptionsDropdown } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdown';
import { ObjectSortDropdownButton } from '@/object-record/object-sort-dropdown/components/ObjectSortDropdownButton';
import { VIEW_SORT_DROPDOWN_ID } from '@/object-record/object-sort-dropdown/constants/ViewSortDropdownId';
import { ObjectSortDropdownComponentInstanceContext } from '@/object-record/object-sort-dropdown/states/context/ObjectSortDropdownComponentInstanceContext';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { ViewBarFilterDropdownIds } from '@/views/constants/ViewBarFilterDropdownIds';
import { ViewBarFilterDropdown } from '@/views/components/ViewBarFilterDropdown';
import { useCanPersistViewChanges } from '@/views/hooks/useCanPersistViewChanges';
import { useSaveCurrentViewFiltersAndSorts } from '@/views/hooks/useSaveCurrentViewFiltersAndSorts';
import { ViewType } from '@/views/types/ViewType';
import { styled } from '@linaria/react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
`;

export const ProjectViewToolbar = () => {
  const { recordIndexId, objectMetadataItem } = useRecordIndexContextOrThrow();
  const { canPersistChanges } = useCanPersistViewChanges();
  const { saveCurrentViewFilterAndSorts } = useSaveCurrentViewFiltersAndSorts();

  return (
    <StyledContainer>
      <ObjectFilterDropdownComponentInstanceContext.Provider
        value={{ instanceId: ViewBarFilterDropdownIds.MAIN }}
      >
        <ViewBarFilterDropdown />
      </ObjectFilterDropdownComponentInstanceContext.Provider>
      <ObjectSortDropdownComponentInstanceContext.Provider
        value={{ instanceId: VIEW_SORT_DROPDOWN_ID }}
      >
        <ObjectSortDropdownButton />
      </ObjectSortDropdownComponentInstanceContext.Provider>
      <ObjectOptionsDropdown
        recordIndexId={recordIndexId}
        objectMetadataItem={objectMetadataItem}
        viewType={ViewType.TABLE}
      />
      {canPersistChanges && (
        <Button
          title="Save view"
          size="small"
          onClick={() => void saveCurrentViewFilterAndSorts()}
        />
      )}
    </StyledContainer>
  );
};
