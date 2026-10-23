import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DISCOUNT_CONSOLE_DELETE_ROUTE_PATH } from '../constants/discount';
import { DISCOUNT_CONSOLE_DELETE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { requireString } from './utils/require-string.util';
import {
  assertCanEditDiscounts,
  resolveDiscountCaller,
} from './utils/resolve-discount-editor.util';
import { runRoute } from './utils/run-route.util';

// A soft delete: the delete trigger tells the app, and the record stays
// restorable from Twenty's deleted view.
const handler = async (event: RoutePayload<{ discountId?: string }>) =>
  runRoute(async (client) => {
    assertCanEditDiscounts(await resolveDiscountCaller());

    const discountId = requireString(event.body?.discountId, 'discount');

    await client.mutation({
      deleteDiscount: { __args: { id: discountId }, id: true },
    });

    return { discountId };
  });

export default defineLogicFunction({
  universalIdentifier: DISCOUNT_CONSOLE_DELETE_LOGIC_FUNCTION_UID,
  name: 'discount-console-delete',
  description: 'Route: deletes a discount; the delete trigger tells its app.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: DISCOUNT_CONSOLE_DELETE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
