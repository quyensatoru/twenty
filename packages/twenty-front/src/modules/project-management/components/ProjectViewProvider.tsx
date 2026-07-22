import { ContextStoreComponentInstanceContext } from '@/context-store/states/contexts/ContextStoreComponentInstanceContext';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { RecordComponentInstanceContextsWrapper } from '@/object-record/components/RecordComponentInstanceContextsWrapper';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { RecordIndexContextProvider } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useRecordIndexFieldMetadataDerivedStates } from '@/object-record/record-index/hooks/useRecordIndexFieldMetadataDerivedStates';
import { ProjectViewContextStoreInitEffect } from '@/project-management/components/ProjectViewContextStoreInitEffect';
import { ProjectViewLoadEffect } from '@/project-management/components/ProjectViewLoadEffect';
import { ViewComponentInstanceContext } from '@/views/states/contexts/ViewComponentInstanceContext';
import { type PropsWithChildren, useCallback } from 'react';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

type ProjectViewProviderProps = PropsWithChildren<{
  objectNameSingular: string;
  viewId: string;
  recordIndexId: string;
}>;

export const ProjectViewProvider = ({
  objectNameSingular,
  viewId,
  recordIndexId,
  children,
}: ProjectViewProviderProps) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const objectPermissions = getObjectPermissionsForObject(
    objectPermissionsByObjectMetadataId,
    objectMetadataItem.id,
  );

  const {
    fieldDefinitionByFieldMetadataItemId,
    fieldMetadataItemByFieldMetadataItemId,
    labelIdentifierFieldMetadataItem,
    recordFieldByFieldMetadataItemId,
  } = useRecordIndexFieldMetadataDerivedStates(
    objectMetadataItem,
    recordIndexId,
  );

  const indexIdentifierUrl = useCallback(
    (recordId: string) =>
      getAppPath(AppPath.RecordShowPage, {
        objectNameSingular,
        objectRecordId: recordId,
      }),
    [objectNameSingular],
  );

  const handleIndexRecordsLoaded = useCallback(() => {}, []);

  if (!objectPermissions.canReadObjectRecords) {
    return null;
  }

  return (
    <ContextStoreComponentInstanceContext.Provider
      value={{ instanceId: recordIndexId }}
    >
      <ProjectViewContextStoreInitEffect
        objectMetadataItemId={objectMetadataItem.id}
        viewId={viewId}
      />
      <RecordIndexContextProvider
        value={{
          objectPermissionsByObjectMetadataId,
          recordIndexId,
          viewBarInstanceId: recordIndexId,
          objectNamePlural: objectMetadataItem.namePlural,
          objectNameSingular,
          objectMetadataItem,
          onIndexRecordsLoaded: handleIndexRecordsLoaded,
          indexIdentifierUrl,
          recordFieldByFieldMetadataItemId,
          labelIdentifierFieldMetadataItem,
          fieldMetadataItemByFieldMetadataItemId,
          fieldDefinitionByFieldMetadataItemId,
        }}
      >
        <ViewComponentInstanceContext.Provider
          value={{ instanceId: recordIndexId }}
        >
          <RecordComponentInstanceContextsWrapper
            componentInstanceId={recordIndexId}
          >
            <ProjectViewLoadEffect
              viewId={viewId}
              objectMetadataItem={objectMetadataItem}
            />
            {children}
          </RecordComponentInstanceContextsWrapper>
        </ViewComponentInstanceContext.Provider>
      </RecordIndexContextProvider>
    </ContextStoreComponentInstanceContext.Provider>
  );
};
