import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DISCOUNT_CONNECTION_SAVE_ROUTE_PATH } from '../constants/discount';
import { DISCOUNT_CONNECTION_SAVE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  readStoredDiscountConnection,
  writeDiscountConnection,
} from './utils/read-discount-settings.util';
import { requireString } from './utils/require-string.util';
import {
  assertCanConfigureDiscounts,
  resolveDiscountCaller,
} from './utils/resolve-discount-editor.util';
import { runRoute } from './utils/run-route.util';

type SaveConnectionBody = {
  appId?: string;
  endpoint?: string;
  // Omitted keeps the stored secret; an empty string removes it.
  secret?: string | null;
};

const readEndpoint = (value: unknown): string => {
  const endpoint = typeof value === 'string' ? value.trim() : '';

  if (endpoint.length === 0) {
    return '';
  }

  let url: URL;

  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('The endpoint must be a full URL, like https://api.example.com/crm/discount.');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('The endpoint must start with https://.');
  }

  return endpoint;
};

const handler = async (event: RoutePayload<SaveConnectionBody>) =>
  runRoute(async () => {
    const caller = await resolveDiscountCaller();

    assertCanConfigureDiscounts(caller);

    const appId = requireString(event.body?.appId, 'app');
    const endpoint = readEndpoint(event.body?.endpoint);
    const stored = await readStoredDiscountConnection(appId);
    const secretInput = event.body?.secret;
    const secret =
      secretInput === undefined || secretInput === null
        ? (stored?.secret ?? '')
        : secretInput.trim();

    await writeDiscountConnection(appId, {
      endpoint,
      secret,
      updatedAt: new Date().toISOString(),
      updatedBy: caller.name,
    });

    return {
      appId,
      endpoint,
      hasSecret: secret.length > 0,
      isConnected: endpoint.length > 0 && secret.length > 0,
    };
  });

export default defineLogicFunction({
  universalIdentifier: DISCOUNT_CONNECTION_SAVE_LOGIC_FUNCTION_UID,
  name: 'discount-connection-save',
  description:
    "Route (Admin role): sets the endpoint and signing secret an app's discounts are sent with.",
  timeoutSeconds: 15,
  httpRouteTriggerSettings: {
    path: DISCOUNT_CONNECTION_SAVE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
