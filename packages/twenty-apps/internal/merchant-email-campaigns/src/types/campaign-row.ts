import { type CampaignStatus } from './campaign-status';
import { type CampaignType } from './campaign-type';
import { type MerchantTrigger } from './merchant-trigger';

export type CampaignRow = {
  id: string;
  name?: string | null;
  campaignType?: CampaignType | null;
  status?: CampaignStatus | null;
  // Legacy: routing reads `eventName`. Kept written so a rollback to the
  // release before dynamic events still finds the four built-in automations.
  trigger?: MerchantTrigger | null;
  eventName?: string | null;
  delayMinutes?: number | null;
  audienceFilter?: unknown;
  fromEmail?: string | null;
  replyTo?: string | null;
  sendOncePerMerchant?: boolean | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  lastError?: string | null;
  templateId?: string | null;
};
