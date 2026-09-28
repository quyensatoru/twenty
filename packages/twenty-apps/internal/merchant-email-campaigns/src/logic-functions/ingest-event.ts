import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { INGEST_EVENT_ROUTE_PATH } from '../constants/route-paths';
import { INGEST_EVENT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { parseInboundEvent } from '../utils/parse-inbound-event.util';
import { pickMerchantsForEvent } from '../utils/pick-merchants-for-event.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { applyEventContact } from './utils/apply-event-contact.util';
import { createAppClient } from './utils/create-app-client.util';
import { findMerchantsForEvent } from './utils/find-merchants-for-event.util';
import { isValidInboundApiKey } from './utils/is-valid-inbound-api-key.util';
import { scheduleCustomEventEmails } from './utils/schedule-custom-event-emails.util';

const jsonError = (status: number, code: string, message: string) =>
  new Response(
    { code, message },
    { status, headers: { 'Content-Type': 'application/json' } },
  );

// Brevo-compatible POST /v3/events: same body, same `api-key` header, 204 on
// success and { code, message } on error, so existing senders keep their
// response handling. The event is logged even when no merchant matches.
const handler = async (event: RoutePayload<unknown>) => {
  if (!isValidInboundApiKey(event.headers ?? {})) {
    return jsonError(401, 'unauthorized', 'Key not found or invalid.');
  }

  const parsed = parseInboundEvent(event.body);

  if (!parsed.ok) {
    return jsonError(400, 'invalid_parameter', parsed.error);
  }

  const inboundEvent = parsed.event;
  const client = createAppClient();

  try {
    const merchants = pickMerchantsForEvent(
      await findMerchantsForEvent(client, inboundEvent),
      inboundEvent,
    );
    const updatedMerchants = await applyEventContact({
      client,
      event: inboundEvent,
      merchants,
    });
    const campaignsQueued = await scheduleCustomEventEmails({
      client,
      event: inboundEvent,
      merchants: updatedMerchants,
    });

    await client.mutation({
      createMerchantEvent: {
        __args: {
          data: {
            name: inboundEvent.eventName,
            email: inboundEvent.email ?? '',
            domain: inboundEvent.domain ?? '',
            properties: {
              contact_properties: inboundEvent.contactProperties,
              event_properties: inboundEvent.eventProperties,
            },
            occurredAt: inboundEvent.occurredAt,
            status: updatedMerchants.length > 0 ? 'MATCHED' : 'UNMATCHED',
            campaignsQueued,
            merchantId: updatedMerchants[0]?.id ?? null,
          },
        },
        id: true,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(
      500,
      'internal_error',
      readErrorMessage(error).slice(0, 500),
    );
  }
};

export default defineLogicFunction({
  universalIdentifier: INGEST_EVENT_LOGIC_FUNCTION_UID,
  name: 'ingest-merchant-event',
  description:
    'Public route, Brevo-compatible: other apps post merchant events with an email; matching custom-event automations send.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: INGEST_EVENT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: ['api-key', 'x-api-key', 'authorization'],
  },
  handler,
});
