import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DISCOUNT_CONSOLE_RESEND_ROUTE_PATH } from '../constants/discount';
import { DISCOUNT_CONSOLE_RESEND_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { dispatchDiscount } from './utils/dispatch-discount.util';
import { readDiscount, toDiscountListItem } from './utils/discount-store.util';
import { isDiscountSyncEnabled } from './utils/read-discount-settings.util';
import { requireString } from './utils/require-string.util';
import {
  assertCanEditDiscounts,
  resolveDiscountCaller,
} from './utils/resolve-discount-editor.util';
import { runRoute } from './utils/run-route.util';

// Sends right away and answers with the app's verdict, unlike a save, which
// leaves the sending to the delivery trigger.
const handler = async (event: RoutePayload<{ discountId?: string }>) =>
  runRoute(async (client) => {
    const caller = await resolveDiscountCaller();

    assertCanEditDiscounts(caller);

    if (!isDiscountSyncEnabled()) {
      throw new Error(
        'Sending discounts is turned off in the Customer Support settings.',
      );
    }

    const discountId = requireString(event.body?.discountId, 'discount');
    const record = await readDiscount(client, discountId);

    if (record === null) {
      throw new Error('This discount no longer exists.');
    }

    if (record.syncStatus === 'DRAFT') {
      throw new Error('Save the draft before sending it.');
    }

    const { outcome } = await dispatchDiscount({
      client,
      record,
      appName: record.app?.name ?? null,
      action: record.syncedAt === null || record.syncedAt === undefined ? 'CREATE' : 'UPDATE',
      triggeredBy: `resend by ${caller.name ?? 'a member'}`,
    });
    const updated = await readDiscount(client, discountId);

    return {
      discount: toDiscountListItem(updated ?? record),
      result: outcome.result,
      errors: outcome.errors,
    };
  });

export default defineLogicFunction({
  universalIdentifier: DISCOUNT_CONSOLE_RESEND_LOGIC_FUNCTION_UID,
  name: 'discount-console-resend',
  description: 'Route: sends a discount to its app again and returns the answer.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: DISCOUNT_CONSOLE_RESEND_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
