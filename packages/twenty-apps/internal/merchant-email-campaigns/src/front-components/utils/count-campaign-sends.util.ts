import { CAMPAIGN_STATS_ROUTE_PATH } from '../../constants/route-paths';
import { type EmailSendStatus } from '../../types/email-send-status';
import { postAppRoute } from './post-app-route.util';

export type FailedSendInfo = {
  to: string;
  error: string;
  at: string | null;
};

export type CampaignSendStats = {
  counts: Record<EmailSendStatus, number>;
  recentFailures: FailedSendInfo[];
};

export const countCampaignSends = async (
  campaignId: string,
): Promise<CampaignSendStats> => {
  const { counts, recentFailures } = await postAppRoute<{
    success: boolean;
    counts: Record<EmailSendStatus, number>;
    recentFailures: FailedSendInfo[];
  }>(CAMPAIGN_STATS_ROUTE_PATH, { campaignId });

  return { counts, recentFailures: recentFailures ?? [] };
};
