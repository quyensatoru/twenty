import { defineLogicFunction } from 'twenty-sdk/define';

import { INBOUND_EVENTS_API_KEY_VARIABLE } from '../constants/application-variable-names';
import {
  INGEST_EVENT_ROUTE_PATH,
  INTEGRATION_INFO_ROUTE_PATH,
} from '../constants/route-paths';
import { INTEGRATION_INFO_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertEmailProviderReady } from '../email-provider/assert-email-provider-ready';
import { readEmailProviderName } from '../email-provider/read-email-provider-name';
import { type Connection } from '../types/connection';
import { type IntegrationInfo } from '../types/integration-info';
import { executeWithRetry } from '../utils/execute-with-retry.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { buildPublicRouteUrl } from './utils/build-public-route-url.util';
import { createAppClient } from './utils/create-app-client.util';

type MerchantEventNode = {
  id: string;
  name?: string | null;
  email?: string | null;
  domain?: string | null;
  status?: string | null;
  campaignsQueued?: number | null;
  occurredAt?: string | null;
  merchant?: { name?: string | null } | null;
};

const readProviderError = (): string | null => {
  try {
    assertEmailProviderReady();

    return null;
  } catch (error) {
    return readErrorMessage(error);
  }
};

// Never returns a secret: only whether the inbound key is set, and the
// provider's config error if there is one.
const handler = async () => {
  try {
    const { merchantEvents } = await executeWithRetry<{
      merchantEvents: Connection<MerchantEventNode>;
    }>(() =>
      createAppClient().query({
        merchantEvents: {
          __args: { first: 20, orderBy: [{ createdAt: 'DescNullsLast' }] },
          edges: {
            node: {
              id: true,
              name: true,
              email: true,
              domain: true,
              status: true,
              campaignsQueued: true,
              occurredAt: true,
              merchant: { name: true },
            },
          },
        },
      }),
    );
    const info: IntegrationInfo = {
      eventsUrl: buildPublicRouteUrl(INGEST_EVENT_ROUTE_PATH),
      isInboundKeySet: Boolean(
        process.env[INBOUND_EVENTS_API_KEY_VARIABLE]?.trim(),
      ),
      provider: readEmailProviderName(),
      providerError: readProviderError(),
      recentEvents: (merchantEvents?.edges ?? []).map(({ node }) => ({
        id: node.id,
        name: node.name ?? '',
        email: node.email ?? '',
        domain: node.domain ?? '',
        status: node.status ?? '',
        campaignsQueued: node.campaignsQueued ?? 0,
        occurredAt: node.occurredAt ?? null,
        merchantName: node.merchant?.name ?? '',
      })),
    };

    return { success: true, ...info };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: INTEGRATION_INFO_LOGIC_FUNCTION_UID,
  name: 'integration-info',
  description:
    'Route: event endpoint URL, provider status and recent inbound events for the studio.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: INTEGRATION_INFO_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
