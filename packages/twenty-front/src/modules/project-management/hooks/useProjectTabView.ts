import { metadataStoreStatusFamilySelector } from '@/metadata-store/states/metadataStoreStatusFamilySelector';
import { useUpdateMetadataStoreDraft } from '@/metadata-store/hooks/useUpdateMetadataStoreDraft';
import { type FlatView } from '@/metadata-store/types/FlatView';
import { type FlatViewField } from '@/metadata-store/types/FlatViewField';
import { type FlatViewSort } from '@/metadata-store/types/FlatViewSort';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { usePerformViewAPIPersist } from '@/views/hooks/internal/usePerformViewAPIPersist';
import { usePerformViewFieldAPIPersist } from '@/views/hooks/internal/usePerformViewFieldAPIPersist';
import { usePerformViewSortAPIPersist } from '@/views/hooks/internal/usePerformViewSortAPIPersist';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useEffect, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import {
  ViewSortDirection,
  ViewType,
  ViewVisibility,
} from '~/generated-metadata/graphql';
import { v4 } from 'uuid';

export type ProjectViewTabKey =
  | 'board'
  | 'backlog'
  | 'sprints'
  | 'epics'
  | 'timelogs';

// issueType is deliberately excluded here on board/backlog (stays the
// hardcoded type icon on ProjectIssueCard) — same reasoning as excluding
// status: avoids the dynamic preview rendering it a second time by default.
const DEFAULT_VIEW_FIELD_NAMES_BY_TAB: Record<ProjectViewTabKey, string[]> = {
  board: ['priority', 'storyPoints', 'assignee', 'sprint', 'epic'],
  backlog: ['priority', 'storyPoints', 'assignee', 'epic'],
  sprints: ['goal'],
  epics: [],
  timelogs: ['member', 'minutesSpent', 'loggedDate', 'description'],
};

const DEFAULT_SORT_BY_TAB: Partial<
  Record<ProjectViewTabKey, { fieldName: string; direction: ViewSortDirection }>
> = {
  sprints: { fieldName: 'startDate', direction: ViewSortDirection.ASC },
  timelogs: { fieldName: 'loggedDate', direction: ViewSortDirection.DESC },
};

export const getProjectTabViewName = (
  tabKey: ProjectViewTabKey,
  projectId: string,
) => `__pm_${tabKey}_view__${projectId}`;

// ponytail: no backend uniqueness constraint on view name, so two sessions
// opening the same project tab for the first time at once can both create a
// hidden view — cosmetic (one orphaned UNLISTED view), not solved here.
export const useProjectTabView = (
  tabKey: ProjectViewTabKey,
  objectNameSingular: string,
  projectId: string,
) => {
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });
  const viewsStatus = useAtomFamilySelectorValue(
    metadataStoreStatusFamilySelector,
    'views',
  );
  const views = useAtomStateValue(viewsSelector);
  const { performViewAPICreate } = usePerformViewAPIPersist();
  const { performViewFieldAPICreate } = usePerformViewFieldAPIPersist();
  const { performViewSortAPICreate } = usePerformViewSortAPIPersist();
  const { addToDraft, applyChanges } = useUpdateMetadataStoreDraft();

  const expectedName = getProjectTabViewName(tabKey, projectId);
  const existingView = views.find(
    (view) =>
      view.objectMetadataId === objectMetadataItem.id &&
      view.name === expectedName,
  );

  const [createdViewId, setCreatedViewId] = useState<string | undefined>(
    undefined,
  );
  const [creationStarted, setCreationStarted] = useState(false);

  useEffect(() => {
    if (
      isDefined(existingView) ||
      isDefined(createdViewId) ||
      creationStarted ||
      viewsStatus !== 'up-to-date'
    ) {
      return;
    }

    setCreationStarted(true);

    const create = async () => {
      const newViewId = v4();

      const createViewResult = await performViewAPICreate(
        {
          input: {
            id: newViewId,
            name: expectedName,
            icon: 'IconList',
            objectMetadataId: objectMetadataItem.id,
            type: ViewType.TABLE_WIDGET,
            visibility: ViewVisibility.UNLISTED,
          },
        },
        objectMetadataItem.id,
      );

      if (createViewResult.status === 'failed') {
        setCreationStarted(false);
        return;
      }

      const createdView = createViewResult.response.data?.createView;

      if (!isDefined(createdView)) {
        setCreationStarted(false);
        return;
      }

      const fieldInputs = DEFAULT_VIEW_FIELD_NAMES_BY_TAB[tabKey]
        .map((fieldName, index) => {
          const fieldMetadataId = objectMetadataItem.fields.find(
            (field) => field.name === fieldName,
          )?.id;

          return isDefined(fieldMetadataId)
            ? {
                fieldMetadataId,
                viewId: newViewId,
                position: index,
                isVisible: true,
              }
            : null;
        })
        .filter(isDefined);

      const createFieldsResult = await performViewFieldAPICreate({
        inputs: fieldInputs,
      });

      const createdViewFields =
        createFieldsResult.status === 'successful'
          ? (createFieldsResult.response?.data?.createManyViewFields ?? [])
          : [];

      const defaultSort = DEFAULT_SORT_BY_TAB[tabKey];
      let createdViewSorts: FlatViewSort[] = [];

      if (isDefined(defaultSort)) {
        const sortFieldMetadataId = objectMetadataItem.fields.find(
          (field) => field.name === defaultSort.fieldName,
        )?.id;

        if (isDefined(sortFieldMetadataId)) {
          const sortResult = await performViewSortAPICreate([
            {
              input: {
                fieldMetadataId: sortFieldMetadataId,
                viewId: newViewId,
                direction: defaultSort.direction,
              },
            },
          ]);

          createdViewSorts =
            sortResult.status === 'successful'
              ? sortResult.response
                  .map((result) => result.data?.createViewSort)
                  .filter(isDefined)
              : [];
        }
      }

      addToDraft({ key: 'views', items: [createdView as FlatView] });
      addToDraft({
        key: 'viewFields',
        items: createdViewFields as FlatViewField[],
      });
      if (createdViewSorts.length > 0) {
        addToDraft({ key: 'viewSorts', items: createdViewSorts });
      }
      applyChanges();

      setCreatedViewId(newViewId);
    };

    void create();
  }, [
    existingView,
    createdViewId,
    creationStarted,
    viewsStatus,
    tabKey,
    expectedName,
    objectMetadataItem,
    performViewAPICreate,
    performViewFieldAPICreate,
    performViewSortAPICreate,
    addToDraft,
    applyChanges,
  ]);

  const viewId = existingView?.id ?? createdViewId;

  return {
    viewId,
    loading: viewsStatus !== 'up-to-date' || !isDefined(viewId),
  };
};
