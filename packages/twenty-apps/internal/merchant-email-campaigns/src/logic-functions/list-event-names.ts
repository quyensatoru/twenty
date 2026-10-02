import { defineLogicFunction } from 'twenty-sdk/define';

import { LIST_EVENT_NAMES_ROUTE_PATH } from '../constants/route-paths';
import { LIST_EVENT_NAMES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type CampaignRow } from '../types/campaign-row';
import { type Connection } from '../types/connection';
import { buildEventNameSuggestions } from '../utils/build-event-name-suggestions.util';
import { executeWithRetry } from '../utils/execute-with-retry.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { createAppClient } from './utils/create-app-client.util';

// The window the catalogue is built from. Deliberately bounded: an event the
// senders stopped emitting a long time ago should stop being suggested.
const RECENT_EVENTS_SAMPLE = 500;
const MAX_CAMPAIGNS = 200;

type ReceivedEventNode = { name?: string | null; occurredAt?: string | null };

// Served from a route rather than queried by the studio: the event log and
// the campaign list are both app-scoped, and a member without grants would
// otherwise get an empty catalogue and no typo warning at all.
const handler = async () => {
  try {
    const client = createAppClient();
    const [{ merchantEvents }, { emailCampaigns }] = await Promise.all([
      executeWithRetry<{ merchantEvents: Connection<ReceivedEventNode> }>(() =>
        client.query({
          merchantEvents: {
            __args: {
              first: RECENT_EVENTS_SAMPLE,
              orderBy: [{ createdAt: 'DescNullsLast' }],
            },
            edges: { node: { name: true, occurredAt: true } },
          },
        }),
      ),
      executeWithRetry<{ emailCampaigns: Connection<CampaignRow> }>(() =>
        client.query({
          emailCampaigns: {
            __args: {
              filter: { campaignType: { eq: 'AUTOMATION' } },
              first: MAX_CAMPAIGNS,
            },
            edges: {
              node: {
                campaignType: true,
                status: true,
                trigger: true,
                eventName: true,
              },
            },
          },
        }),
      ),
    ]);

    return {
      success: true,
      eventNames: buildEventNameSuggestions({
        receivedEvents: (merchantEvents?.edges ?? []).map(({ node }) => ({
          name: node.name ?? null,
          occurredAt: node.occurredAt ?? null,
        })),
        campaigns: (emailCampaigns?.edges ?? []).map(({ node }) => node),
      }),
    };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: LIST_EVENT_NAMES_LOGIC_FUNCTION_UID,
  name: 'list-event-names',
  description:
    'Route: the event names the API has received and the ones automations are bound to, so the studio can offer them instead of a fixed list.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: LIST_EVENT_NAMES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
