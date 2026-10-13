import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import {
  kv,
  Response,
  type ServerRouteResolverResult,
} from 'twenty-sdk/logic-function';

import {
  getCrispWebsiteClaimKey,
  HANDLED_CRISP_EVENTS,
} from '../constants/crisp';
import {
  CRISP_WEBHOOK_EVENT_LOGIC_FUNCTION_UID,
  CRISP_WEBHOOK_RESOLVER_LOGIC_FUNCTION_UID,
} from '../constants/universal-identifiers';
import { type CrispWebhookBody } from '../types/crisp-api';
import {
  findCrispWebsite,
  readCrispSettings,
} from './utils/read-crisp-settings.util';
import { verifyCrispSignature } from './utils/verify-crisp-signature.util';

// Answers fast and does no CRM work: Crisp retries anything slower than about
// a second, so the delivery is only authenticated here and the server queues
// the event for crisp-webhook-event. A 2xx tells Crisp to stop retrying, which
// is the right answer for events we deliberately skip.
export const crispWebhookResolverHandler = async (
  routePayload: RoutePayload<CrispWebhookBody>,
): Promise<ServerRouteResolverResult> => {
  const settings = readCrispSettings();
  const body = routePayload.body ?? {};

  if (
    !verifyCrispSignature({
      secret: settings.webhookSecret,
      timestamp: routePayload.headers?.['x-crisp-request-timestamp'],
      signature: routePayload.headers?.['x-crisp-signature'],
      rawBody: routePayload.rawBody,
      body: routePayload.body,
    })
  ) {
    return new Response({ error: 'Invalid Crisp signature' }, { status: 401 });
  }

  const website = findCrispWebsite(settings, body.website_id);

  if (
    !settings.enabled ||
    website === undefined ||
    typeof body.event !== 'string' ||
    !HANDLED_CRISP_EVENTS.has(body.event)
  ) {
    return new Response({ ignored: true }, { status: 200 });
  }

  const workspaceId = await kv.get<string>(
    getCrispWebsiteClaimKey(website.websiteId),
    { scope: 'SERVER' },
  );

  // Not claimed yet means no sync has run since the website id was set; a 503
  // keeps Crisp retrying until one has.
  if (typeof workspaceId !== 'string' || workspaceId.length === 0) {
    return new Response(
      { error: 'Crisp website is not linked to a workspace yet' },
      { status: 503 },
    );
  }

  return {
    workspaceId,
    targetLogicFunctionUniversalIdentifier:
      CRISP_WEBHOOK_EVENT_LOGIC_FUNCTION_UID,
    payload: {
      event: body.event,
      website_id: website.websiteId,
      data: body.data ?? {},
      timestamp: body.timestamp,
    },
  };
};

export default defineLogicFunction({
  universalIdentifier: CRISP_WEBHOOK_RESOLVER_LOGIC_FUNCTION_UID,
  name: 'crisp-webhook-resolver',
  description:
    'Public endpoint for the Crisp plugin web hook: verifies the signature and queues the event.',
  timeoutSeconds: 15,
  handler: crispWebhookResolverHandler,
  serverRouteTriggerSettings: {
    httpMethods: ['POST'],
    forwardedRequestHeaders: [
      'x-crisp-request-timestamp',
      'x-crisp-signature',
      'x-delivery-attempt-count',
    ],
  },
});
