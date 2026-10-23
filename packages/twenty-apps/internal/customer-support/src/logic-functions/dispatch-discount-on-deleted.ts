import {
  defineLogicFunction,
  type ObjectRecordDeleteEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { DISPATCH_DISCOUNT_ON_DELETED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createAppClient } from './utils/create-app-client.util';
import { type DiscountRecord } from './utils/discount-store.util';
import {
  dispatchDiscount,
  shouldDispatch,
} from './utils/dispatch-discount.util';
import { listAllRecords } from './utils/list-all-records.util';

const handler = async (
  event: DatabaseEventPayload<ObjectRecordDeleteEvent<DiscountRecord>>,
) => {
  const record = event.properties.before;

  if (!shouldDispatch(record) || typeof record.appId !== 'string') {
    return { skipped: true };
  }

  const client = createAppClient();
  const [app] = await listAllRecords<{ name?: string | null }>({
    client,
    pluralName: 'apps',
    filter: { id: { eq: record.appId } },
    selection: { id: true, name: true },
    maxRecords: 1,
  });
  const { syncStatus } = await dispatchDiscount({
    client,
    record: { ...record, id: event.recordId },
    appName: app?.name ?? null,
    action: 'DELETE',
    triggeredBy: 'delete',
    workspaceId: event.workspaceId,
    objectMetadataId: event.objectMetadata.id,
  });

  return { syncStatus };
};

export default defineLogicFunction({
  universalIdentifier: DISPATCH_DISCOUNT_ON_DELETED_LOGIC_FUNCTION_UID,
  name: 'dispatch-discount-on-deleted',
  description: "Tells a discount's app that the discount was deleted.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'discount.deleted',
  },
  handler,
});
