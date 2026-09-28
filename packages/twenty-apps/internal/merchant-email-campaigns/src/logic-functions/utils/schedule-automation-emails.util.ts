import { type ApiClient } from '../../types/api-client';
import { type MerchantRow } from '../../types/merchant-row';
import { type MerchantTrigger } from '../../types/merchant-trigger';
import { matchesAudienceFilter } from '../../utils/matches-audience-filter.util';
import { parseAudienceFilter } from '../../utils/parse-audience-filter.util';
import { enqueueAutomationEmail } from './enqueue-automation-email.util';
import { fetchActiveAutomations } from './fetch-active-automations.util';

// Only queues work: the send job re-reads the campaign and merchant when it
// runs, so a campaign paused or a merchant who reinstalled during the delay is
// caught there rather than mailed with stale data.
export const scheduleAutomationEmails = async ({
  client,
  merchant,
  triggers,
}: {
  client: ApiClient;
  merchant: MerchantRow;
  triggers: MerchantTrigger[];
}): Promise<{ triggers: MerchantTrigger[]; queued: number }> => {
  if (triggers.length === 0) {
    return { triggers, queued: 0 };
  }

  const campaigns = await fetchActiveAutomations(client, triggers);
  let queued = 0;

  for (const campaign of campaigns) {
    const trigger = campaign.trigger;

    if (
      trigger === null ||
      trigger === undefined ||
      !triggers.includes(trigger) ||
      !matchesAudienceFilter(
        merchant,
        parseAudienceFilter(campaign.audienceFilter),
      )
    ) {
      continue;
    }

    queued += await enqueueAutomationEmail({
      campaign,
      merchantId: merchant.id,
      trigger,
    });
  }

  return { triggers, queued };
};
