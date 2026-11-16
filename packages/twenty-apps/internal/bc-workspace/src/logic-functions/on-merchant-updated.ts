import {
  defineLogicFunction,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  applyMerchantChange,
  type MerchantSnapshot,
} from './utils/automation-merchant.util';
import { readMerchant } from './utils/automation-records.util';
import { createAppClient } from './utils/create-app-client.util';
import { recomputeClientStatus } from './utils/recompute-client-status.util';

const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<MerchantSnapshot>>,
) => {
  const { before, after, updatedFields } = event.properties;
  const changed = new Set(updatedFields ?? []);
  const client = createAppClient();
  const merchant = await readMerchant(client, event.recordId);

  if (merchant === null) {
    return { outcome: 'ignored' };
  }

  // A merchant row moving between clients changes the subscriptions of both.
  if (changed.has('vipClientId')) {
    for (const vipClientId of new Set([before.vipClientId, after.vipClientId])) {
      if (typeof vipClientId === 'string') {
        await recomputeClientStatus({ client, vipClientId });
      }
    }
  }

  const outcomes = await applyMerchantChange({
    client,
    merchant,
    before: {
      pricingPlan: changed.has('pricingPlan') ? before.pricingPlan : undefined,
      using: changed.has('using') ? before.using : undefined,
    },
    after: {
      ...after,
      pricingPlan: merchant.pricingPlan,
      using: merchant.using,
      // Only a plan start written in this same update dates this change.
      planStartedAt: changed.has('planStartedAt') ? (after.planStartedAt ?? null) : null,
    },
  });

  return { outcomes };
};

export default defineLogicFunction({
  universalIdentifier: ON_MERCHANT_UPDATED_LOGIC_FUNCTION_UID,
  name: 'on-merchant-updated',
  description:
    'Turns plan changes, uninstalls and reinstalls of VIP client apps into subscription events, credits BC-influenced upgrades and opens retention tasks.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.updated',
    updatedFields: ['pricingPlan', 'using', 'uninstalledAt', 'vipClientId'],
  },
  handler,
});
