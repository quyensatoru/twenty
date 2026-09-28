import { CAMPAIGN_STATS_ROUTE_PATH } from '../../constants/route-paths';
import { type EmailSendStatus } from '../../types/email-send-status';
import { postAppRoute } from './post-app-route.util';

export const countCampaignSends = async (
  campaignId: string,
): Promise<Record<EmailSendStatus, number>> => {
  const { counts } = await postAppRoute<{
    success: boolean;
    counts: Record<EmailSendStatus, number>;
  }>(CAMPAIGN_STATS_ROUTE_PATH, { campaignId });

  return counts;
};
