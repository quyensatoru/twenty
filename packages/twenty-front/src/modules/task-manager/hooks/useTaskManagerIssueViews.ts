import { isDefined } from 'twenty-shared/utils';

import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { type View } from '@/views/types/View';
import { ViewType } from '@/views/types/ViewType';

// Kanban views are now seeded per-project (see
// project-post-query-hook.service.ts on the server): each one carries a
// permanent `project` filter. We match on that filter's value instead of
// picking "the" Kanban view, since there can be many. The `allIssues` TABLE
// view is still shared/global.
const viewHasProjectFilter = (
  view: View,
  projectFieldMetadataId: string,
  projectId: string,
): boolean =>
  view.viewFilters.some((viewFilter) => {
    if (viewFilter.fieldMetadataId !== projectFieldMetadataId) {
      return false;
    }

    try {
      const parsedValue = JSON.parse(viewFilter.value) as {
        selectedRecordIds?: string[];
      };

      return parsedValue.selectedRecordIds?.includes(projectId) ?? false;
    } catch {
      return false;
    }
  });

export const useTaskManagerIssueViews = ({
  projectId,
}: { projectId?: string } = {}) => {
  const { objectMetadataItem: issueObjectMetadataItem } = useObjectMetadataItem(
    { objectNameSingular: 'issue' },
  );

  const issueViews = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: issueObjectMetadataItem.id },
  );

  const kanbanViews = issueViews.filter(
    (view) => view.type === ViewType.KANBAN,
  );

  const projectField = issueObjectMetadataItem.fields.find(
    (field) => field.name === 'project',
  );

  const projectKanbanView =
    isDefined(projectId) && isDefined(projectField)
      ? kanbanViews.find((view) =>
          viewHasProjectFilter(view, projectField.id, projectId),
        )
      : undefined;

  const kanbanView = projectKanbanView ?? kanbanViews[0];
  const tableView = issueViews.find((view) => view.type === ViewType.TABLE);

  return { issueObjectMetadataItem, kanbanView, tableView };
};
