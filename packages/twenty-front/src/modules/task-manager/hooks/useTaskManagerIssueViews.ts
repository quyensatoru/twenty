import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { ViewType } from '@/views/types/ViewType';

// The `issue` standard object ships with two pre-registered views (see
// compute-standard-issue-views.util.ts on the server): a KANBAN view named
// `byStatus` (group-by the status field) and a TABLE view named `allIssues`.
// We reuse their ids as the recordIndexId scope for our custom screens
// instead of minting new views, so field show/hide/reorder state persists
// through the same mechanism as the generic /objects/issues page.
export const useTaskManagerIssueViews = () => {
  const { objectMetadataItem: issueObjectMetadataItem } = useObjectMetadataItem(
    { objectNameSingular: 'issue' },
  );

  const issueViews = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: issueObjectMetadataItem.id },
  );

  const kanbanView = issueViews.find((view) => view.type === ViewType.KANBAN);
  const tableView = issueViews.find((view) => view.type === ViewType.TABLE);

  return { issueObjectMetadataItem, kanbanView, tableView };
};
