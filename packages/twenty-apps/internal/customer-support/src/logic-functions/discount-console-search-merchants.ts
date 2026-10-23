import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DISCOUNT_CONSOLE_SEARCH_MERCHANTS_ROUTE_PATH } from '../constants/discount';
import { DISCOUNT_CONSOLE_SEARCH_MERCHANTS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type MerchantOption } from '../types/discount';
import { listAllRecords } from './utils/list-all-records.util';
import { runRoute } from './utils/run-route.util';

const MERCHANT_RESULT_LIMIT = 12;

type SearchBody = { query?: string; appId?: string | null };

type MerchantNode = {
  id: string;
  name?: string | null;
  app?: { name?: string | null } | null;
};

const handler = async (event: RoutePayload<SearchBody>) =>
  runRoute(async (client) => {
    const query = (event.body?.query ?? '').trim().toLowerCase();

    if (query.length < 2) {
      return { merchants: [] };
    }

    const appId = event.body?.appId ?? null;
    const nodes = await listAllRecords<MerchantNode>({
      client,
      pluralName: 'merchants',
      filter: {
        name: { ilike: `%${query}%` },
        ...(appId === null ? {} : { appId: { eq: appId } }),
      },
      selection: { id: true, name: true, app: { name: true } },
      orderBy: [{ name: 'AscNullsLast' }],
      maxRecords: MERCHANT_RESULT_LIMIT,
    });

    const merchants: MerchantOption[] = nodes
      .filter((node) => typeof node.name === 'string')
      .map((node) => ({
        id: node.id,
        name: node.name as string,
        appName: node.app?.name ?? null,
      }));

    return { merchants };
  });

export default defineLogicFunction({
  universalIdentifier: DISCOUNT_CONSOLE_SEARCH_MERCHANTS_LOGIC_FUNCTION_UID,
  name: 'discount-console-search-merchants',
  description: "Route: merchants of one app whose shop domain matches what was typed.",
  timeoutSeconds: 15,
  httpRouteTriggerSettings: {
    path: DISCOUNT_CONSOLE_SEARCH_MERCHANTS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
