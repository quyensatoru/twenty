import { defineLogicFunction } from 'twenty-sdk/define';

import { SYNC_VIP_CLIENTS_CRON_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import {
  selectVipCandidates,
  VIP_PRICING_PLANS,
  VIP_SHOPIFY_PLANS,
  type VipEligibilityMerchant,
} from '../utils/vip-eligibility.util';
import { createAppClient } from './utils/create-app-client.util';
import { listAllRecords } from './utils/list-all-records.util';
import {
  type OptionalMerchantField,
  readOptionalMerchantFields,
} from './utils/merchant-fields.util';
import { readErrorMessage } from './utils/read-error-message.util';
import { createRecord, updateRecord } from './utils/record-store.util';

const RUN_BUDGET_MS = 100_000;

const REQUIRED_MERCHANT_FIELDS: OptionalMerchantField[] = ['pricingPlan', 'using', 'shopifyPlan'];

type SyncMerchant = {
  id: string;
  name: string | null;
  storeName: string | null;
  using: boolean | null;
  pricingPlan: string | null;
  shopifyPlan: string | null;
  vipClientId: string | null;
  app: { name: string | null } | null;
};

const MERCHANT_SYNC_SELECTION = {
  id: true,
  name: true,
  storeName: true,
  using: true,
  pricingPlan: true,
  shopifyPlan: true,
  vipClientId: true,
  app: { name: true },
};

const toEligibilityMerchant = (merchant: SyncMerchant): VipEligibilityMerchant => ({
  name: merchant.name,
  storeName: merchant.storeName,
  using: merchant.using,
  pricingPlan: merchant.pricingPlan,
  shopifyPlan: merchant.shopifyPlan,
  appName: merchant.app?.name ?? null,
});

const listShopMerchants = (client: ApiClient, shopDomain: string) =>
  listAllRecords<SyncMerchant>({
    client,
    pluralName: 'merchants',
    filter: { name: { ilike: shopDomain.replace(/[\\%_]/g, '\\$&') } },
    selection: MERCHANT_SYNC_SELECTION,
  });

// New installs of existing VIP shops are linked by on-merchant-created; this
// only adds shops that newly meet the VIP rules. Shops never lose VIP here.
const handler = async () => {
  const startedAt = Date.now();
  const client = createAppClient();
  const optionalFields = await readOptionalMerchantFields(client);

  if (!REQUIRED_MERCHANT_FIELDS.every((field) => optionalFields.has(field))) {
    return { skipped: 'merchant plan fields missing in this workspace' };
  }

  const [qualifying, vipClients] = await Promise.all([
    listAllRecords<SyncMerchant>({
      client,
      pluralName: 'merchants',
      filter: {
        using: { eq: true },
        or: [
          { shopifyPlan: { in: VIP_SHOPIFY_PLANS } },
          { pricingPlan: { in: VIP_PRICING_PLANS } },
        ],
      },
      selection: MERCHANT_SYNC_SELECTION,
    }),
    listAllRecords<{ shopDomain: string | null }>({
      client,
      pluralName: 'vipClients',
      selection: { shopDomain: true },
    }),
  ]);
  const knownShops = new Set(vipClients.map((vipClient) => vipClient.shopDomain?.toLowerCase()));
  const newShops = selectVipCandidates(qualifying.map(toEligibilityMerchant)).filter(
    (candidate) => !knownShops.has(candidate.shopDomain),
  );
  const created: string[] = [];
  const errors: { shopDomain: string; error: string }[] = [];

  for (const { shopDomain } of newShops) {
    if (Date.now() - startedAt > RUN_BUDGET_MS) {
      break;
    }

    try {
      // Re-check on every install of the shop: one dev-store install disqualifies it.
      const shopMerchants = await listShopMerchants(client, shopDomain);
      const [candidate] = selectVipCandidates(shopMerchants.map(toEligibilityMerchant));

      if (candidate === undefined) {
        continue;
      }

      const vipClient = await createRecord<{ id: string }>({
        client,
        objectNameSingular: 'vipClient',
        data: { name: candidate.name, shopDomain },
        selection: { id: true },
      });

      for (const merchant of shopMerchants) {
        if (merchant.vipClientId === null) {
          await updateRecord({
            client,
            objectNameSingular: 'merchant',
            id: merchant.id,
            data: { vipClientId: vipClient.id },
          });
        }
      }

      created.push(shopDomain);
    } catch (error) {
      errors.push({ shopDomain, error: readErrorMessage(error) });
    }
  }

  return { pending: newShops.length, created, errors };
};

export default defineLogicFunction({
  universalIdentifier: SYNC_VIP_CLIENTS_CRON_LOGIC_FUNCTION_UID,
  name: 'sync-vip-clients-cron',
  description:
    'Hourly: adds a VIP client for every shop that newly meets the VIP rules (Shopify Advanced/Plus, or a qualifying MIDA, Fraud or BLOY plan; dev and test stores excluded) and links its app installs.',
  timeoutSeconds: 120,
  cronTriggerSettings: {
    pattern: '15 * * * *',
  },
  handler,
});
