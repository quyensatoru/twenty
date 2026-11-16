import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { MERCHANT_SEARCH_ROUTE_PATH } from '../constants/route-paths';
import { MERCHANT_SEARCH_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type MerchantRecord } from '../types/bc-records';
import { type MerchantDomainOption } from '../types/dashboard';
import { listAllRecords } from './utils/list-all-records.util';
import {
  readOptionalMerchantFields,
  resolveMerchantSelection,
} from './utils/merchant-fields.util';
import { runBcRoute } from './utils/run-bc-route.util';

const RESULT_LIMIT = 15;
const SCAN_LIMIT = 120;

const handler = async (event: RoutePayload<{ query?: string }>) =>
  runBcRoute(async ({ client, scope }) => {
    if (scope.role !== 'ADMIN' && scope.role !== 'MANAGER') {
      throw new Error('Not authorized: only BC managers can add VIP clients.');
    }

    const query = (event.body?.query ?? '').trim().toLowerCase();

    if (query.length < 2) {
      return { shops: [] };
    }

    const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
    const optionalFields = await readOptionalMerchantFields(client);
    const merchants = await listAllRecords<MerchantRecord>({
      client,
      pluralName: 'merchants',
      filter: optionalFields.has('storeName')
        ? { or: [{ name: { ilike: pattern } }, { storeName: { ilike: pattern } }] }
        : { name: { ilike: pattern } },
      selection: await resolveMerchantSelection(client),
      orderBy: [{ name: 'AscNullsLast' }],
      maxRecords: SCAN_LIMIT,
    });

    // A shop has one merchant row per app; the panel offers the shop once.
    const byDomain = new Map<string, MerchantDomainOption>();

    for (const merchant of merchants) {
      const shopDomain = (merchant.name ?? '').trim().toLowerCase();

      if (shopDomain.length === 0) {
        continue;
      }

      const option = byDomain.get(shopDomain) ?? {
        shopDomain,
        storeName: null,
        appNames: [],
        vipClientId: null,
      };

      option.storeName = option.storeName ?? merchant.storeName;
      option.vipClientId = option.vipClientId ?? merchant.vipClientId;

      if (merchant.app?.name && !option.appNames.includes(merchant.app.name)) {
        option.appNames.push(merchant.app.name);
      }

      byDomain.set(shopDomain, option);
    }

    return { shops: [...byDomain.values()].slice(0, RESULT_LIMIT) };
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_SEARCH_LOGIC_FUNCTION_UID,
  name: 'bc-merchant-search',
  description:
    'Route: shops whose domain or store name matches what was typed, with their apps, for adding a VIP client.',
  timeoutSeconds: 20,
  httpRouteTriggerSettings: {
    path: MERCHANT_SEARCH_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
