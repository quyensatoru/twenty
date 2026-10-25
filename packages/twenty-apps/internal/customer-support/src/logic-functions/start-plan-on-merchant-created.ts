import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { START_PLAN_ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type PlanDataMerchant } from './utils/plan-data.util';
import { createAppClient } from './utils/create-app-client.util';
import { executeWithRetry } from './utils/execute-with-retry.util';
import { syncMerchantPlanDataFromEvent } from './utils/sync-conversation-plan-data.util';

// The app's CRM sync creates the merchant on install, so the install is when
// its first plan starts.
const handler = async (
  event: DatabaseEventPayload<
    ObjectRecordCreateEvent<Partial<PlanDataMerchant>>
  >,
) => {
  if ((event.properties.after.planStartedAt ?? null) === null) {
    // start-plan-on-merchant-updated reacts to this write and syncs the chats.
    await executeWithRetry(() =>
      createAppClient().mutation({
        updateMerchant: {
          __args: {
            id: event.recordId,
            data: { planStartedAt: new Date().toISOString() },
          },
          id: true,
        },
      }),
    );

    return { planStarted: true };
  }

  // Chats linked before the plan start was written have no plan data yet.
  return syncMerchantPlanDataFromEvent(event.recordId);
};

export default defineLogicFunction({
  universalIdentifier: START_PLAN_ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID,
  name: 'start-plan-on-merchant-created',
  description:
    "Starts a new merchant's plan clock and writes it into its Crisp conversations' session data.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.created',
  },
  handler,
});
