import { defineLogicFunction } from 'twenty-sdk/define';

import { CAMPAIGN_SELECTION } from '../constants/campaign-selection';
import { START_SCHEDULED_CAMPAIGNS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { type CampaignRow } from '../types/campaign-row';
import { type Connection } from '../types/connection';
import { executeWithRetry } from '../utils/execute-with-retry.util';
import { startBroadcast } from './utils/start-broadcast.util';
import { createAppClient } from './utils/create-app-client.util';

const handler = async () => {
  const client: ApiClient = createAppClient();
  const { emailCampaigns } = await executeWithRetry<{
    emailCampaigns: Connection<CampaignRow>;
  }>(() =>
    client.query({
      emailCampaigns: {
        __args: {
          filter: {
            campaignType: { eq: 'BROADCAST' },
            status: { eq: 'SCHEDULED' },
            scheduledAt: { lte: new Date().toISOString() },
          },
          first: 20,
        },
        edges: { node: CAMPAIGN_SELECTION },
      },
    }),
  );
  const dueCampaigns = (emailCampaigns?.edges ?? []).map((edge) => edge.node);

  for (const campaign of dueCampaigns) {
    await startBroadcast(client, campaign);
  }

  return { started: dueCampaigns.map((campaign) => campaign.id) };
};

export default defineLogicFunction({
  universalIdentifier: START_SCHEDULED_CAMPAIGNS_LOGIC_FUNCTION_UID,
  name: 'start-scheduled-campaigns',
  description:
    'Every 5 minutes: starts scheduled broadcasts whose send date has passed.',
  timeoutSeconds: 60,
  cronTriggerSettings: { pattern: '*/5 * * * *' },
  handler,
});
