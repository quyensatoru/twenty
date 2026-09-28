import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { LAUNCH_CAMPAIGN_ROUTE_PATH } from '../constants/route-paths';
import { LAUNCH_CAMPAIGN_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertEmailProviderReady } from '../email-provider/assert-email-provider-ready';
import { type CampaignAction } from '../types/campaign-action';
import { readErrorMessage } from '../utils/read-error-message.util';
import { resolveCampaignTransition } from '../utils/resolve-campaign-transition.util';
import { currentUserCanSendCampaigns } from './utils/current-user-can-send-campaigns.util';
import { fetchCampaign } from './utils/fetch-campaign.util';
import { resolveSender } from './utils/resolve-sender.util';
import { startBroadcast } from './utils/start-broadcast.util';
import { updateCampaign } from './utils/update-campaign.util';
import { createAppClient } from './utils/create-app-client.util';

const handler = async (
  event: RoutePayload<{ campaignId?: string; action?: CampaignAction }>,
) => {
  try {
    if (!(await currentUserCanSendCampaigns())) {
      return {
        success: false,
        error:
          'You are not allowed to launch campaigns. Ask an admin to add you to CAMPAIGN_SENDERS.',
      };
    }

    const { campaignId, action } = event.body ?? {};

    if (!campaignId || !action) {
      return { success: false, error: 'campaignId and action are required.' };
    }

    const client = createAppClient();
    const campaign = await fetchCampaign(client, campaignId);

    if (campaign === null) {
      return { success: false, error: 'Campaign not found.' };
    }

    const transition = resolveCampaignTransition({ campaign, action });

    if (!transition.ok) {
      return { success: false, error: transition.error };
    }

    // Fails here, in front of the member, rather than later inside a job.
    if (transition.nextStatus === 'ACTIVE' || transition.startsBroadcast) {
      assertEmailProviderReady();
      resolveSender(campaign);
    }

    if (transition.startsBroadcast) {
      await startBroadcast(client, campaign);
    } else {
      await updateCampaign(client, campaignId, {
        status: transition.nextStatus,
        ...(transition.nextStatus === 'ACTIVE' && !campaign.startedAt
          ? { startedAt: new Date().toISOString() }
          : {}),
        ...(transition.nextStatus === 'CANCELED'
          ? { completedAt: new Date().toISOString() }
          : {}),
        lastError: '',
      });
    }

    return { success: true, status: transition.nextStatus };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: LAUNCH_CAMPAIGN_LOGIC_FUNCTION_UID,
  name: 'launch-campaign',
  description:
    'Route: activates, pauses, resumes, schedules, sends or cancels a campaign for an allowed member.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: LAUNCH_CAMPAIGN_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
