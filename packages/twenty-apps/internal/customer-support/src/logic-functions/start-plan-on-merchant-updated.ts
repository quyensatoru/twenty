import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { START_PLAN_ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type PlanDataMerchant, startsNewPlan } from './utils/plan-data.util';
import { createAppClient } from './utils/create-app-client.util';
import { executeWithRetry } from './utils/execute-with-retry.util';
import { syncMerchantPlanDataFromEvent } from './utils/sync-conversation-plan-data.util';

// Updates the chats right away instead of waiting for the daily scan, so a
// cancellation or an upgrade shows in the Crisp filters the same day.
const handler = async (
  event: DatabaseEventPayload<
    ObjectRecordUpdateEvent<Partial<PlanDataMerchant>>
  >,
) => {
  if (startsNewPlan(event.properties.before, event.properties.after)) {
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
  }

  return syncMerchantPlanDataFromEvent(event.recordId);
};

export default defineLogicFunction({
  universalIdentifier: START_PLAN_ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID,
  name: 'start-plan-on-merchant-updated',
  description:
    "Restarts the plan clock on a plan change or reinstall, and rewrites the plan session data of the merchant's Crisp conversations whenever its plan or plan start changes.",
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.updated',
    // planStartedAt is listed so a backfill or a manual fix reaches Crisp at
    // once. The write below fires this again, but with the plan unchanged
    // that run only syncs, so it does not loop.
    updatedFields: ['pricingPlan', 'using', 'planStartedAt'],
  },
  handler,
});
