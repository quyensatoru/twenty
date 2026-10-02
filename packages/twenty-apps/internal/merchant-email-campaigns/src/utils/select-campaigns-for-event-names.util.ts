import { type CampaignRow } from '../types/campaign-row';
import { normalizeEventName } from './normalize-event-name.util';
import { resolveCampaignEventName } from './resolve-campaign-event-name.util';

// The decision of which automations an event wakes up, kept out of the
// GraphQL layer so it is testable. Every automation bound to the event runs:
// two templates on one event both send, each still filtered by its own
// audience and its own send-once rule.
export const selectCampaignsForEventNames = (
  campaigns: CampaignRow[],
  eventNames: string[],
): CampaignRow[] => {
  const wanted = new Set(
    eventNames
      .map((eventName) => normalizeEventName(eventName))
      .filter((eventName): eventName is string => eventName !== null),
  );

  if (wanted.size === 0) {
    return [];
  }

  const seen = new Set<string>();

  return campaigns.filter((campaign) => {
    const eventName = resolveCampaignEventName(campaign);

    if (
      campaign.campaignType !== 'AUTOMATION' ||
      campaign.status !== 'ACTIVE' ||
      eventName === null ||
      !wanted.has(eventName) ||
      seen.has(campaign.id)
    ) {
      return false;
    }

    seen.add(campaign.id);

    return true;
  });
};
