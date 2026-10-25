import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventBatchPayload } from 'twenty-sdk/logic-function';

import { START_PLAN_ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type PlanDataMerchant, startsNewPlan } from './utils/plan-data.util';
import { createAppClient } from './utils/create-app-client.util';
import { executeWithRetry } from './utils/execute-with-retry.util';
import { syncMerchantPlanDataFromEvent } from './utils/sync-conversation-plan-data.util';

// Updates the chats right away instead of waiting for the daily scan, so a
// cancellation or an upgrade shows in the Crisp filters the same day.
const handler = async (
  batch: DatabaseEventBatchPayload<
    ObjectRecordUpdateEvent<Partial<PlanDataMerchant>>
  >,
) => {
  const merchantIdsStartingPlan = new Set(
    batch.events
      .filter((event) =>
        startsNewPlan(event.properties.before, event.properties.after),
      )
      .map((event) => event.recordId),
  );
  const results = [];

  for (const merchantId of new Set(
    batch.events.map((event) => event.recordId),
  )) {
    if (!merchantIdsStartingPlan.has(merchantId)) {
      results.push(await syncMerchantPlanDataFromEvent(merchantId));
      continue;
    }

    // The planStartedAt write triggers this function again, and that run
    // syncs: syncing here too would search Crisp twice per plan change.
    await executeWithRetry(() =>
      createAppClient().mutation({
        updateMerchant: {
          __args: {
            id: merchantId,
            data: { planStartedAt: new Date().toISOString() },
          },
          id: true,
        },
      }),
    );
  }

  return results;
};

export default defineLogicFunction({
  universalIdentifier: START_PLAN_ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID,
  name: 'start-plan-on-merchant-updated',
  description:
    "Restarts the plan clock on a plan change or reinstall, and rewrites the plan session data of the merchant's Crisp conversations whenever its plan or plan start changes.",
  timeoutSeconds: 300,
  databaseEventTriggerSettings: {
    eventName: 'merchant.updated',
    // planStartedAt is listed so a backfill or a manual fix reaches Crisp at
    // once. The write below fires this again, but with the plan unchanged
    // that run only syncs, so it does not loop.
    updatedFields: ['pricingPlan', 'using', 'planStartedAt'],
    batchMode: true,
  },
  handler,
});
