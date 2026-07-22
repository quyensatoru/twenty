import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useLoadRecordIndexStates } from '@/object-record/record-index/hooks/useLoadRecordIndexStates';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewFromViewIdFamilySelector } from '@/views/states/selectors/viewFromViewIdFamilySelector';
import { useEffect, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';

type ProjectViewLoadEffectProps = {
  viewId: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
};

export const ProjectViewLoadEffect = ({
  viewId,
  objectMetadataItem,
}: ProjectViewLoadEffectProps) => {
  const { loadRecordIndexStates } = useLoadRecordIndexStates();
  const { recordIndexId } = useRecordIndexContextOrThrow();

  const view = useAtomFamilySelectorValue(viewFromViewIdFamilySelector, {
    viewId,
  });

  const viewHasFields = isDefined(view) && view.viewFields.length > 0;

  const [lastLoadedViewId, setLastLoadedViewId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!viewHasFields || !isDefined(view)) {
      return;
    }

    if (lastLoadedViewId === view.id) {
      return;
    }

    loadRecordIndexStates(view, objectMetadataItem, {
      skipGlobalIndexStates: true,
      recordIndexId,
    });

    setLastLoadedViewId(view.id);
  }, [
    view,
    viewHasFields,
    objectMetadataItem,
    loadRecordIndexStates,
    recordIndexId,
    lastLoadedViewId,
  ]);

  return null;
};
