import {
  defineLogicFunction,
  type ObjectRecordCreateEvent,
} from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type MerchantRecord } from '../types/bc-records';
import { computeMrrDelta } from '../utils/automation-plan.util';
import {
  findVipClientByShopDomain,
  listPlanCatalog,
  readMerchant,
} from './utils/automation-records.util';
import { recordSubscriptionChange } from './utils/automation-subscription.util';
import { createAppClient } from './utils/create-app-client.util';
import { updateRecord } from './utils/record-store.util';

// A VIP shop installing another product: the new merchant row joins the
// client so the dashboard shows the app next to the others.
const handler = async (
  event: DatabaseEventPayload<ObjectRecordCreateEvent<MerchantRecord>>,
) => {
  const client = createAppClient();
  const merchant = await readMerchant(client, event.recordId);

  if (merchant === null) {
    return { outcome: 'ignored', reason: 'merchant not found' };
  }

  const vipClient =
    merchant.vipClientId === null
      ? await findVipClientByShopDomain(client, merchant.name)
      : null;

  if (vipClient === null) {
    return { outcome: 'ignored', reason: 'not a VIP shop' };
  }

  await updateRecord({
    client,
    objectNameSingular: 'merchant',
    id: merchant.id,
    data: { vipClientId: vipClient.id },
  });

  const appName = merchant.app?.name ?? null;

  await recordSubscriptionChange(client, {
    vipClient,
    merchantId: merchant.id,
    appName,
    eventType: 'INSTALL',
    oldPlan: null,
    newPlan: merchant.pricingPlan,
    occurredAt: merchant.installedAt ?? new Date().toISOString(),
    mrrDelta: computeMrrDelta({
      plans: await listPlanCatalog(client),
      appName,
      oldPlan: null,
      newPlan: merchant.pricingPlan,
    }),
    source: 'CRM_SYNC',
  });

  return { outcome: 'linked', vipClientId: vipClient.id };
};

export default defineLogicFunction({
  universalIdentifier: ON_MERCHANT_CREATED_LOGIC_FUNCTION_UID,
  name: 'on-merchant-created',
  description:
    'Links a new app install of a VIP shop to its VIP client and records the install.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: {
    eventName: 'merchant.created',
  },
  handler,
});
