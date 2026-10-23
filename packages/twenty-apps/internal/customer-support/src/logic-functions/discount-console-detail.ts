import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DISCOUNT_CONSOLE_DETAIL_ROUTE_PATH } from '../constants/discount';
import { DISCOUNT_CONSOLE_DETAIL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  listSyncLogs,
  readDiscount,
  toDiscountListItem,
} from './utils/discount-store.util';
import { requireString } from './utils/require-string.util';
import { runRoute } from './utils/run-route.util';

const handler = async (event: RoutePayload<{ discountId?: string }>) =>
  runRoute(async (client) => {
    const discountId = requireString(event.body?.discountId, 'discount');
    const record = await readDiscount(client, discountId);

    if (record === null) {
      throw new Error('This discount no longer exists.');
    }

    return {
      discount: toDiscountListItem(record),
      syncLogs: await listSyncLogs(client, discountId),
    };
  });

export default defineLogicFunction({
  universalIdentifier: DISCOUNT_CONSOLE_DETAIL_LOGIC_FUNCTION_UID,
  name: 'discount-console-detail',
  description: 'Route: one discount and the history of its deliveries to its app.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: DISCOUNT_CONSOLE_DETAIL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
