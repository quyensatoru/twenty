import { type ApiClient } from '../../types/api-client';
import { type MerchantRow } from '../../types/merchant-row';
import { matchesAudienceFilter } from '../../utils/matches-audience-filter.util';
import { parseAudienceFilter } from '../../utils/parse-audience-filter.util';
import { resolveCampaignEventName } from '../../utils/resolve-campaign-event-name.util';
import { enqueueAutomationEmail } from './enqueue-automation-email.util';
import { fetchAutomationsForEventNames } from './fetch-automations-for-event-names.util';

// The one routing path: a merchant row changing and an app posting to the
// events API both land here with event names and the merchant rows they
// concern. One email per campaign per event, sent to the first of the shop's
// merchant rows the campaign's audience accepts, because the owner behind all
// those rows is the same person.
//
// Only queues work: the send job re-reads the campaign and the merchant when
// it runs, so a campaign paused or a merchant who reinstalled during the
// delay is caught there rather than mailed with stale data.
export const scheduleEventEmails = async ({
  client,
  eventNames,
  merchants,
  eventProperties,
}: {
  client: ApiClient;
  eventNames: string[];
  merchants: MerchantRow[];
  eventProperties?: Record<string, string>;
}): Promise<number> => {
  if (eventNames.length === 0 || merchants.length === 0) {
    return 0;
  }

  const campaigns = await fetchAutomationsForEventNames(client, eventNames);
  let queued = 0;

  for (const campaign of campaigns) {
    const eventName = resolveCampaignEventName(campaign);
    const audienceFilter = parseAudienceFilter(campaign.audienceFilter);
    const merchant = merchants.find((candidate) =>
      matchesAudienceFilter(candidate, audienceFilter),
    );

    if (eventName === null || merchant === undefined) {
      continue;
    }

    queued += await enqueueAutomationEmail({
      campaign,
      merchantId: merchant.id,
      trigger: eventName,
      eventProperties,
    });
  }

  return queued;
};
