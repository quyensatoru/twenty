import { type ApiClient } from '../../types/api-client';
import { type InboundEvent } from '../../types/inbound-event';
import { type MerchantRow } from '../../types/merchant-row';
import { matchesAudienceFilter } from '../../utils/matches-audience-filter.util';
import { parseAudienceFilter } from '../../utils/parse-audience-filter.util';
import { stringifyEventProperties } from '../../utils/stringify-event-properties.util';
import { enqueueAutomationEmail } from './enqueue-automation-email.util';
import { fetchCustomEventAutomations } from './fetch-custom-event-automations.util';

// One email per campaign per event, sent to the first of the shop's merchant
// rows the campaign's audience accepts: the owner behind all those rows is the
// same person and should not get one copy per app.
export const scheduleCustomEventEmails = async ({
  client,
  event,
  merchants,
}: {
  client: ApiClient;
  event: InboundEvent;
  merchants: MerchantRow[];
}): Promise<number> => {
  if (merchants.length === 0) {
    return 0;
  }

  const campaigns = await fetchCustomEventAutomations(client, event.eventName);
  const eventProperties = stringifyEventProperties(
    event.contactProperties,
    event.eventProperties,
  );
  let queued = 0;

  for (const campaign of campaigns) {
    const audienceFilter = parseAudienceFilter(campaign.audienceFilter);
    const merchant = merchants.find((candidate) =>
      matchesAudienceFilter(candidate, audienceFilter),
    );

    if (merchant === undefined) {
      continue;
    }

    queued += await enqueueAutomationEmail({
      campaign,
      merchantId: merchant.id,
      trigger: event.eventName,
      eventProperties,
    });
  }

  return queued;
};
