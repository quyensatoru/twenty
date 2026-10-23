import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { DISCOUNT_DISPATCH_FIELDS } from '../constants/discount';
import { DISPATCH_DISCOUNT_ON_UPDATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  dispatchDiscount,
  shouldDispatch,
} from './utils/dispatch-discount.util';
import { createAppClient } from './utils/create-app-client.util';
import {
  type DiscountRecord,
  readDiscount,
} from './utils/discount-store.util';

const DISPATCH_FIELDS = new Set<string>(DISCOUNT_DISPATCH_FIELDS);

// Sends when something the app reads changed, or when the Discounts page
// queued the discount (status moved to PENDING). The writes this trigger and
// the apps make themselves (sync status, timesUsed) send nothing, which is
// what keeps the two sides from bouncing a change back and forth.
const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<DiscountRecord>>,
) => {
  const { before, after, updatedFields } = event.properties;
  const changedFields = (updatedFields ?? []).filter((field) =>
    DISPATCH_FIELDS.has(field),
  );
  const isQueued =
    after.syncStatus === 'PENDING' && before.syncStatus !== 'PENDING';

  if ((changedFields.length === 0 && !isQueued) || !shouldDispatch(after)) {
    return { skipped: true };
  }

  const client = createAppClient();
  const record = await readDiscount(client, event.recordId);

  if (record === null) {
    return { skipped: true };
  }

  const { syncStatus } = await dispatchDiscount({
    client,
    record,
    appName: record.app?.name ?? null,
    action: before.syncStatus === 'DRAFT' ? 'CREATE' : 'UPDATE',
    triggeredBy: 'change',
    updatedFields: changedFields,
    workspaceId: event.workspaceId,
    objectMetadataId: event.objectMetadata.id,
  });

  return { syncStatus };
};

export default defineLogicFunction({
  universalIdentifier: DISPATCH_DISCOUNT_ON_UPDATED_LOGIC_FUNCTION_UID,
  name: 'dispatch-discount-on-updated',
  description:
    "Sends a changed discount to its app's server and records the answer.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'discount.updated',
    updatedFields: [...DISCOUNT_DISPATCH_FIELDS, 'syncStatus'],
  },
  handler,
});
