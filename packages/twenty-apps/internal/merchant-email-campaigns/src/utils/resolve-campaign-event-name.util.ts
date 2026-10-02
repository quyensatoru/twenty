import { type CampaignRow } from '../types/campaign-row';
import { eventNameForLegacyTrigger } from './event-name-for-legacy-trigger.util';
import { normalizeEventName } from './normalize-event-name.util';

export const resolveCampaignEventName = (
  campaign: Pick<CampaignRow, 'eventName' | 'trigger'>,
): string | null =>
  normalizeEventName(campaign.eventName) ??
  eventNameForLegacyTrigger(campaign.trigger);
