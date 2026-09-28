import { defineLogicFunction } from 'twenty-sdk/define';

import { SEND_AUTOMATION_EMAIL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { sendOneEmail } from '../email-provider/send-one-email';
import { matchesAudienceFilter } from '../utils/matches-audience-filter.util';
import { parseAudienceFilter } from '../utils/parse-audience-filter.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { readMerchantEmail } from '../utils/read-merchant-email.util';
import { createEmailSendRecords } from './utils/create-email-send-records.util';
import { fetchCampaign } from './utils/fetch-campaign.util';
import { fetchMerchant } from './utils/fetch-merchant.util';
import { fetchTemplate } from './utils/fetch-template.util';
import { hasMerchantBeenEmailed } from './utils/has-merchant-been-emailed.util';
import { prepareMerchantEmail } from './utils/prepare-merchant-email.util';
import { updateCampaign } from './utils/update-campaign.util';
import { createAppClient } from './utils/create-app-client.util';

type SendAutomationEmailPayload = {
  campaignId?: string;
  merchantId?: string;
  trigger?: string;
  eventProperties?: Record<string, string>;
};

const handler = async (payload: SendAutomationEmailPayload) => {
  const {
    campaignId,
    merchantId,
    trigger = '',
    eventProperties,
  } = payload ?? {};

  if (!campaignId || !merchantId) {
    return {
      status: 'SKIPPED',
      reason: 'campaignId and merchantId are required',
    };
  }

  const client = createAppClient();
  const campaign = await fetchCampaign(client, campaignId);

  if (campaign?.status !== 'ACTIVE' || !campaign.templateId) {
    return {
      status: 'SKIPPED',
      reason: 'Campaign is not active or has no template',
    };
  }

  const [template, merchant] = await Promise.all([
    fetchTemplate(client, campaign.templateId),
    fetchMerchant(client, merchantId),
  ]);

  if (template === null || merchant === null) {
    return {
      status: 'SKIPPED',
      reason: 'Template or merchant no longer exists',
    };
  }

  // Re-checked against the row as it is now: a win-back mail must not go out
  // to a merchant who reinstalled while the delay was running.
  if (
    !matchesAudienceFilter(
      merchant,
      parseAudienceFilter(campaign.audienceFilter),
    )
  ) {
    return { status: 'SKIPPED', reason: 'Merchant left the audience' };
  }

  const sendOnce = campaign.sendOncePerMerchant !== false;

  if (
    sendOnce &&
    (await hasMerchantBeenEmailed({ client, campaignId, merchantId }))
  ) {
    return { status: 'SKIPPED', reason: 'Already emailed by this campaign' };
  }

  const baseRecord = { campaignId, merchantId, trigger, providerMessageId: '' };

  // A missing sender or API key is a setup problem: it is logged on the send
  // and on the campaign instead of failing the job silently in the queue.
  try {
    const prepared = prepareMerchantEmail({
      campaign,
      template,
      merchant,
      eventProperties,
    });

    if (prepared.kind === 'SKIPPED') {
      await createEmailSendRecords(client, [
        {
          ...baseRecord,
          name: prepared.to,
          subject: template.subject ?? '',
          status: 'SKIPPED',
          errorMessage: prepared.reason,
          sentAt: null,
        },
      ]);

      return { status: 'SKIPPED', reason: prepared.reason };
    }

    const result = await sendOneEmail(
      prepared.email,
      sendOnce ? `${campaignId}:${merchantId}` : undefined,
    );

    await createEmailSendRecords(client, [
      {
        ...baseRecord,
        name: prepared.to,
        subject: prepared.subject,
        status: result.ok ? 'SENT' : 'FAILED',
        providerMessageId: result.ok ? result.id : '',
        errorMessage: result.ok ? '' : result.error,
        sentAt: result.ok ? new Date().toISOString() : null,
      },
    ]);

    return result.ok
      ? { status: 'SENT', providerMessageId: result.id }
      : { status: 'FAILED', error: result.error };
  } catch (error) {
    const message = readErrorMessage(error).slice(0, 1000);

    await createEmailSendRecords(client, [
      {
        ...baseRecord,
        name: readMerchantEmail(merchant) ?? '',
        subject: template.subject ?? '',
        status: 'FAILED',
        errorMessage: message,
        sentAt: null,
      },
    ]);
    await updateCampaign(client, campaignId, { lastError: message });

    return { status: 'FAILED', error: message };
  }
};

export default defineLogicFunction({
  universalIdentifier: SEND_AUTOMATION_EMAIL_LOGIC_FUNCTION_UID,
  name: 'send-automation-email',
  description:
    'Job: sends one automation email to one merchant after re-checking the campaign and audience.',
  timeoutSeconds: 60,
  handler,
});
