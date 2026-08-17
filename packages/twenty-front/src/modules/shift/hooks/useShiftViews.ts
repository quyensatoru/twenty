import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { ViewType } from '@/views/types/ViewType';

// The `allShifts` TABLE view is seeded per-workspace (see
// compute-standard-shift-views.util.ts on the server) as the single INDEX view
// for the shift object, so we resolve it by view type — the same table-view
// branch useTaskManagerIssueViews uses for `allIssues`.
export const useShiftViews = () => {
  const { objectMetadataItem: shiftObjectMetadataItem } = useObjectMetadataItem(
    { objectNameSingular: 'shift' },
  );

  const shiftViews = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: shiftObjectMetadataItem.id },
  );

  const tableView = shiftViews.find((view) => view.type === ViewType.TABLE);

  return { shiftObjectMetadataItem, tableView };
};
