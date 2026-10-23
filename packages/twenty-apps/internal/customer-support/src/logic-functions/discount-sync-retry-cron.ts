import { defineLogicFunction } from 'twenty-sdk/define';

import { DISCOUNT_SYNC_RETRY_CRON_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createAppClient } from './utils/create-app-client.util';
import {
  dispatchDiscount,
  shouldDispatch,
} from './utils/dispatch-discount.util';
import { listDiscounts } from './utils/discount-store.util';
import { isDiscountSyncEnabled } from './utils/read-discount-settings.util';
import { readErrorMessage } from './utils/read-error-message.util';

const RETRIES_PER_RUN = 25;
// An app that answered 202 has this long to report back before the discount
// is sent again.
const PENDING_GRACE_MINUTES = 30;

const handler = async () => {
  if (!isDiscountSyncEnabled()) {
    return { retried: 0 };
  }

  const client = createAppClient();
  const now = new Date();
  const staleBefore = new Date(
    now.getTime() - PENDING_GRACE_MINUTES * 60_000,
  ).toISOString();
  const due = await listDiscounts(client, {
    or: [
      {
        syncStatus: { eq: 'FAILED' },
        nextSyncAt: { lte: now.toISOString() },
      },
      {
        syncStatus: { eq: 'PENDING' },
        updatedAt: { lt: staleBefore },
      },
    ],
  });
  let retried = 0;

  for (const record of due.slice(0, RETRIES_PER_RUN)) {
    if (!shouldDispatch(record)) {
      continue;
    }

    try {
      await dispatchDiscount({
        client,
        record,
        appName: record.app?.name ?? null,
        action: record.syncedAt ? 'UPDATE' : 'CREATE',
        triggeredBy: 'retry',
      });
      retried += 1;
    } catch (error) {
      console.error(
        `Discount ${record.id} retry failed: ${readErrorMessage(error)}`,
      );
    }
  }

  return { retried, due: due.length };
};

export default defineLogicFunction({
  universalIdentifier: DISCOUNT_SYNC_RETRY_CRON_LOGIC_FUNCTION_UID,
  name: 'discount-sync-retry-cron',
  description:
    'Every 5 minutes: sends again the discounts an app could not be reached for, and the ones it never reported back on.',
  timeoutSeconds: 300,
  cronTriggerSettings: {
    pattern: '*/5 * * * *',
  },
  handler,
});
