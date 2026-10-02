import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { INGEST_EVENT_ROUTE_PATH } from '../constants/route-paths';
import { INGEST_EVENT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { normalizeEventName } from '../utils/normalize-event-name.util';
import { parseInboundEvent } from '../utils/parse-inbound-event.util';
import { pickMerchantsForEvent } from '../utils/pick-merchants-for-event.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { stringifyEventProperties } from '../utils/stringify-event-properties.util';
import { applyEventContact } from './utils/apply-event-contact.util';
import { createAppClient } from './utils/create-app-client.util';
import { findMerchantsForEvent } from './utils/find-merchants-for-event.util';
import { isValidInboundApiKey } from './utils/is-valid-inbound-api-key.util';
import { scheduleEventEmails } from './utils/schedule-event-emails.util';

const jsonError = (status: number, code: string, message: string) =>
  new Response(
    { code, message },
    { status, headers: { 'Content-Type': 'application/json' } },
  );

// Brevo-compatible POST /v3/events: same body, same `api-key` header, 204 on
// success and { code, message } on error, so existing senders keep their
// response handling. `event_name` is whatever the sender chose; it is stored
// normalized so the event log doubles as the catalogue the studio offers when
// someone binds an automation to an event. The event is logged even when no
// merchant and no automation match it.
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
    const eventName =
      normalizeEventName(inboundEvent.eventName) ?? inboundEvent.eventName;
    const campaignsQueued = await scheduleEventEmails({
      client,
      eventNames: [inboundEvent.eventName],
      merchants: updatedMerchants,
      eventProperties: stringifyEventProperties(
        inboundEvent.contactProperties,
        inboundEvent.eventProperties,
      ),
    });

    await client.mutation({
      createMerchantEvent: {
        __args: {
          data: {
            name: eventName,
            email: inboundEvent.email ?? '',
            domain: inboundEvent.domain ?? '',
            properties: {
              contact_properties: inboundEvent.contactProperties,
              event_properties: inboundEvent.eventProperties,
              ...(eventName === inboundEvent.eventName
                ? {}
                : { event_name_as_sent: inboundEvent.eventName }),
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
    'Public route, Brevo-compatible: other apps post merchant events with an email; every active automation bound to that event name sends.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: INGEST_EVENT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: ['api-key', 'x-api-key', 'authorization'],
  },
  handler,
});
