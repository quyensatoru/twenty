import { contextStoreCurrentObjectMetadataItemIdComponentState } from '@/context-store/states/contextStoreCurrentObjectMetadataItemIdComponentState';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { contextStoreCurrentViewTypeComponentState } from '@/context-store/states/contextStoreCurrentViewTypeComponentState';
import { ContextStoreViewType } from '@/context-store/types/ContextStoreViewType';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useEffect, useState } from 'react';

type ProjectViewContextStoreInitEffectProps = {
  objectMetadataItemId: string;
  viewId: string;
};

// Hydrates synchronously on first render (not via useEffect): children
// mounted in this same pass (e.g. ObjectOptionsDropdown, which reads the
// context-store object metadata id unconditionally at the top of its own
// hooks) need the value set before they render, not after commit.
export const ProjectViewContextStoreInitEffect = ({
  objectMetadataItemId,
  viewId,
}: ProjectViewContextStoreInitEffectProps) => {
  const setContextStoreCurrentObjectMetadataItemId = useSetAtomComponentState(
    contextStoreCurrentObjectMetadataItemIdComponentState,
  );

  const setContextStoreCurrentViewId = useSetAtomComponentState(
    contextStoreCurrentViewIdComponentState,
  );

  const setContextStoreCurrentViewType = useSetAtomComponentState(
    contextStoreCurrentViewTypeComponentState,
  );

  useState(() => {
    setContextStoreCurrentObjectMetadataItemId(objectMetadataItemId);
    setContextStoreCurrentViewId(viewId);
    setContextStoreCurrentViewType(ContextStoreViewType.Table);
    return null;
  });

  useEffect(() => {
    setContextStoreCurrentObjectMetadataItemId(objectMetadataItemId);
    setContextStoreCurrentViewId(viewId);
    setContextStoreCurrentViewType(ContextStoreViewType.Table);
  }, [
    objectMetadataItemId,
    viewId,
    setContextStoreCurrentObjectMetadataItemId,
    setContextStoreCurrentViewId,
    setContextStoreCurrentViewType,
  ]);

  return null;
};
