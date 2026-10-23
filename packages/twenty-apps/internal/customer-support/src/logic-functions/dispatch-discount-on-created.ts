import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { DISPATCH_DISCOUNT_ON_CREATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  dispatchDiscount,
  shouldDispatch,
} from './utils/dispatch-discount.util';
import { createAppClient } from './utils/create-app-client.util';
import {
  type DiscountRecord,
  readDiscount,
} from './utils/discount-store.util';

// A discount created without app or code (Twenty's own "New record" row) is
// not sent until it is complete, so the app never gets an empty one.
const handler = async (
  event: DatabaseEventPayload<ObjectRecordCreateEvent<DiscountRecord>>,
) => {
  if (!shouldDispatch(event.properties.after)) {
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
    action: 'CREATE',
    triggeredBy: 'create',
    workspaceId: event.workspaceId,
    objectMetadataId: event.objectMetadata.id,
  });

  return { syncStatus };
};

export default defineLogicFunction({
  universalIdentifier: DISPATCH_DISCOUNT_ON_CREATED_LOGIC_FUNCTION_UID,
  name: 'dispatch-discount-on-created',
  description: "Sends a new discount to its app's server and records the answer.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'discount.created',
  },
  handler,
});
