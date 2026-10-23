import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { DISCOUNT_SYNC_RESULT_ROUTE_PATH } from '../constants/discount';
import { DISCOUNT_SYNC_RESULT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createAppClient } from './utils/create-app-client.util';
import {
  interpretAppResponse,
  isValidDeliverySignature,
} from './utils/discount-delivery.util';
import {
  createSyncLog,
  findSyncLogByDeliveryId,
  updateDiscount,
} from './utils/discount-store.util';
import {
  summarizeErrors,
  toSyncStatus,
} from './utils/dispatch-discount.util';
import { readDiscountAppConnection } from './utils/read-discount-settings.util';
import { readErrorMessage } from './utils/read-error-message.util';

type SyncResultBody = {
  deliveryId?: string;
  status?: string;
  externalId?: string;
  errors?: unknown;
};

// The late answer of an app that replied 202. It calls with its CRM API key
// and signs the body with the discount secret, so a key leaked elsewhere
// cannot flip a discount to applied.
const handler = async (event: RoutePayload<SyncResultBody>) => {
  try {
    const deliveryId = event.body?.deliveryId;

    if (typeof deliveryId !== 'string' || deliveryId.length === 0) {
      return new Response({ error: 'Missing deliveryId' }, { status: 400 });
    }

    const client = createAppClient();
    const delivery = await findSyncLogByDeliveryId(client, deliveryId);

    if (delivery === null) {
      return new Response({ error: 'Unknown deliveryId' }, { status: 404 });
    }

    const secret =
      (await readDiscountAppConnection(delivery.appId))?.secret ?? '';
    const rawBody = event.rawBody ?? JSON.stringify(event.body ?? {});

    if (
      !isValidDeliverySignature({
        secret,
        timestamp: event.headers?.['x-twenty-webhook-timestamp'],
        signature: event.headers?.['x-twenty-webhook-signature'],
        body: rawBody,
      })
    ) {
      return new Response({ error: 'Invalid signature' }, { status: 401 });
    }

    const outcome = interpretAppResponse(200, event.body);

    await createSyncLog(client, {
      discountId: delivery.discountId,
      appName: delivery.appName,
      action: 'UPDATE',
      result: outcome.result,
      httpStatus: null,
      durationMs: null,
      errors: outcome.errors,
      request: null,
      response: event.body,
      deliveryId,
      triggeredBy: 'app callback',
    });
    await updateDiscount(client, delivery.discountId, {
      syncStatus: toSyncStatus(outcome.result),
      syncError: summarizeErrors(outcome.errors),
      syncAttempts: 0,
      nextSyncAt: null,
      ...(outcome.result === 'APPLIED'
        ? {
            syncedAt: new Date().toISOString(),
            ...(outcome.externalId === null
              ? {}
              : { externalId: outcome.externalId }),
          }
        : {}),
    });

    return { ok: true };
  } catch (error) {
    return new Response({ error: readErrorMessage(error) }, { status: 500 });
  }
};

export default defineLogicFunction({
  universalIdentifier: DISCOUNT_SYNC_RESULT_LOGIC_FUNCTION_UID,
  name: 'discount-sync-result',
  description:
    "Route for app servers: reports the outcome of a discount delivery they answered with 202.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: DISCOUNT_SYNC_RESULT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
    forwardedRequestHeaders: [
      'x-twenty-webhook-timestamp',
      'x-twenty-webhook-signature',
    ],
  },
  handler,
});
