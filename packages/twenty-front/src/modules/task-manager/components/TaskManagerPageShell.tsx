import { type ReactNode, useEffect } from 'react';

import { ContextStoreComponentInstanceContext } from '@/context-store/states/contexts/ContextStoreComponentInstanceContext';
import { contextStoreCurrentObjectMetadataItemIdComponentState } from '@/context-store/states/contextStoreCurrentObjectMetadataItemIdComponentState';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { RecordComponentInstanceContextsWrapper } from '@/object-record/components/RecordComponentInstanceContextsWrapper';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { RecordIndexLoadBaseOnContextStoreEffect } from '@/object-record/record-index/components/RecordIndexLoadBaseOnContextStoreEffect';
import { RecordIndexContextProvider } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useRecordIndexFieldMetadataDerivedStates } from '@/object-record/record-index/hooks/useRecordIndexFieldMetadataDerivedStates';
import { getRecordIndexIdFromObjectNamePluralAndViewId } from '@/object-record/utils/getRecordIndexIdFromObjectNamePluralAndViewId';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useTaskManagerIssueViews } from '@/task-manager/hooks/useTaskManagerIssueViews';
import { ViewComponentInstanceContext } from '@/views/states/contexts/ViewComponentInstanceContext';

const TASK_MANAGER_CONTEXT_STORE_INSTANCE_ID = 'task-manager';

// Mounts the same instance-context provider stack RecordIndexPage uses, so
// the reused field-system hooks (visibility/order, ObjectOptionsDropdown,
// RecordInlineCell) work exactly like they do on generic object pages.
// See RecordIndexContainerGater.tsx for the reference wiring this mirrors.
//
// The contextStoreCurrent* atoms are only set by an effect (they're read by
// deeper consumers like ObjectOptionsDropdown/RecordIndexLoadBaseOnContextStoreEffect
// via useContextStoreObjectMetadataItemOrThrow, which throws on an empty id) —
// so nothing below this gate can render until the effect has actually run once.
const TaskManagerContextStoreGate = ({
  viewId,
  children,
}: {
  viewId: string;
  children: ReactNode;
}) => {
  const { issueObjectMetadataItem } = useTaskManagerIssueViews();

  const [
    contextStoreCurrentObjectMetadataItemId,
    setContextStoreCurrentObjectMetadataItemId,
  ] = useAtomComponentState(
    contextStoreCurrentObjectMetadataItemIdComponentState,
    TASK_MANAGER_CONTEXT_STORE_INSTANCE_ID,
  );
  const [contextStoreCurrentViewId, setContextStoreCurrentViewId] =
    useAtomComponentState(
      contextStoreCurrentViewIdComponentState,
      TASK_MANAGER_CONTEXT_STORE_INSTANCE_ID,
    );

  useEffect(() => {
    setContextStoreCurrentObjectMetadataItemId(issueObjectMetadataItem.id);
    setContextStoreCurrentViewId(viewId);
  }, [
    issueObjectMetadataItem.id,
    viewId,
    setContextStoreCurrentObjectMetadataItemId,
    setContextStoreCurrentViewId,
  ]);

  const isContextStoreReady =
    contextStoreCurrentObjectMetadataItemId === issueObjectMetadataItem.id &&
    contextStoreCurrentViewId === viewId;

  if (!isContextStoreReady) {
    return null;
  }

  return <>{children}</>;
};

type TaskManagerPageShellProps = {
  viewId: string;
  children: ReactNode;
};

export const TaskManagerPageShell = ({
  viewId,
  children,
}: TaskManagerPageShellProps) => {
  const { issueObjectMetadataItem } = useTaskManagerIssueViews();

  const recordIndexId = getRecordIndexIdFromObjectNamePluralAndViewId(
    issueObjectMetadataItem.namePlural,
    viewId,
  );

  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const objectPermissions = getObjectPermissionsForObject(
    objectPermissionsByObjectMetadataId,
    issueObjectMetadataItem.id,
  );

  const {
    fieldDefinitionByFieldMetadataItemId,
    fieldMetadataItemByFieldMetadataItemId,
    labelIdentifierFieldMetadataItem,
    recordFieldByFieldMetadataItemId,
  } = useRecordIndexFieldMetadataDerivedStates(
    issueObjectMetadataItem,
    recordIndexId,
  );

  return (
    <ContextStoreComponentInstanceContext.Provider
      value={{ instanceId: TASK_MANAGER_CONTEXT_STORE_INSTANCE_ID }}
    >
      <TaskManagerContextStoreGate viewId={viewId}>
        <RecordIndexContextProvider
          value={{
            objectPermissionsByObjectMetadataId,
            recordIndexId,
            viewBarInstanceId: recordIndexId,
            objectNamePlural: issueObjectMetadataItem.namePlural,
            objectNameSingular: issueObjectMetadataItem.nameSingular,
            objectMetadataItem: issueObjectMetadataItem,
            onIndexRecordsLoaded: () => {},
            indexIdentifierUrl: (recordId) => `/task-manager/issue/${recordId}`,
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
              {objectPermissions.canReadObjectRecords ? children : null}
            </RecordComponentInstanceContextsWrapper>
            <RecordIndexLoadBaseOnContextStoreEffect />
          </ViewComponentInstanceContext.Provider>
        </RecordIndexContextProvider>
      </TaskManagerContextStoreGate>
    </ContextStoreComponentInstanceContext.Provider>
  );
};
