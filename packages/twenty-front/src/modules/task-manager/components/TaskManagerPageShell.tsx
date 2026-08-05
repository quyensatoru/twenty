import { type ReactNode, useEffect } from 'react';

import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

import { getCommandMenuIdFromRecordIndexId } from '@/command-menu-item/utils/getCommandMenuIdFromRecordIndexId';
import { CommandMenuComponentInstanceContext } from '@/command-menu/states/contexts/CommandMenuComponentInstanceContext';
import { ContextStoreComponentInstanceContext } from '@/context-store/states/contexts/ContextStoreComponentInstanceContext';
import { contextStoreCurrentObjectMetadataItemIdComponentState } from '@/context-store/states/contextStoreCurrentObjectMetadataItemIdComponentState';
import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { contextStoreNumberOfSelectedRecordsComponentState } from '@/context-store/states/contextStoreNumberOfSelectedRecordsComponentState';
import { contextStoreTargetedRecordsRuleComponentState } from '@/context-store/states/contextStoreTargetedRecordsRuleComponentState';
import { getObjectPermissionsForObject } from '@/object-metadata/utils/getObjectPermissionsForObject';
import { RecordComponentInstanceContextsWrapper } from '@/object-record/components/RecordComponentInstanceContextsWrapper';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { RecordIndexLoadBaseOnContextStoreEffect } from '@/object-record/record-index/components/RecordIndexLoadBaseOnContextStoreEffect';
import { RecordIndexContextProvider } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useRecordIndexFieldMetadataDerivedStates } from '@/object-record/record-index/hooks/useRecordIndexFieldMetadataDerivedStates';
import { getRecordIndexIdFromObjectNamePluralAndViewId } from '@/object-record/utils/getRecordIndexIdFromObjectNamePluralAndViewId';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useTaskManagerIssueViews } from '@/task-manager/hooks/useTaskManagerIssueViews';
import { ViewComponentInstanceContext } from '@/views/states/contexts/ViewComponentInstanceContext';

// The generic RecordIndexContainerContextStoreNumberOfSelectedRecordsEffect also
// resolves "select all" totals via useFindManyRecordIndexTableParams, which needs
// filter/sort instance contexts this shell doesn't set up. Task Manager's board
// selection never produces exclusion mode, so a plain selectedRecordIds.length
// mirror covers the only case that occurs here.
const TaskManagerNumberOfSelectedRecordsEffect = () => {
  const contextStoreTargetedRecordsRule = useAtomComponentStateValue(
    contextStoreTargetedRecordsRuleComponentState,
  );

  const setContextStoreNumberOfSelectedRecords = useSetAtomComponentState(
    contextStoreNumberOfSelectedRecordsComponentState,
  );

  useEffect(() => {
    setContextStoreNumberOfSelectedRecords(
      contextStoreTargetedRecordsRule.mode === 'selection'
        ? contextStoreTargetedRecordsRule.selectedRecordIds.length
        : 0,
    );
  }, [contextStoreTargetedRecordsRule, setContextStoreNumberOfSelectedRecords]);

  return null;
};

// Scoped per viewId (not a single shared constant): the side panel can mount
// a second TaskManagerPageShell (issue detail, tableView) while a full-page
// one is already mounted underneath (e.g. Board, kanbanView). A shared
// instance id would make them stomp each other's contextStoreCurrentViewId,
// failing the gate below for whichever one didn't write last (blank page).
const getTaskManagerContextStoreInstanceId = (viewId: string) =>
  `task-manager-${viewId}`;

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
  const contextStoreInstanceId = getTaskManagerContextStoreInstanceId(viewId);

  const [
    contextStoreCurrentObjectMetadataItemId,
    setContextStoreCurrentObjectMetadataItemId,
  ] = useAtomComponentState(
    contextStoreCurrentObjectMetadataItemIdComponentState,
    contextStoreInstanceId,
  );
  const [contextStoreCurrentViewId, setContextStoreCurrentViewId] =
    useAtomComponentState(
      contextStoreCurrentViewIdComponentState,
      contextStoreInstanceId,
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
      value={{ instanceId: getTaskManagerContextStoreInstanceId(viewId) }}
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
            indexIdentifierUrl: (recordId) =>
              getAppPath(AppPath.TaskManagerIssuePage, { issueId: recordId }),
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
              <CommandMenuComponentInstanceContext.Provider
                value={{
                  instanceId: getCommandMenuIdFromRecordIndexId(recordIndexId),
                }}
              >
                {objectPermissions.canReadObjectRecords ? children : null}
              </CommandMenuComponentInstanceContext.Provider>
            </RecordComponentInstanceContextsWrapper>
            <RecordIndexLoadBaseOnContextStoreEffect />
            <TaskManagerNumberOfSelectedRecordsEffect />
          </ViewComponentInstanceContext.Provider>
        </RecordIndexContextProvider>
      </TaskManagerContextStoreGate>
    </ContextStoreComponentInstanceContext.Provider>
  );
};
