import { defineLogicFunction } from 'twenty-sdk/define';

import { RUN_BROADCAST_BATCH_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { resolveBroadcastPageSize } from '../email-provider/resolve-broadcast-page-size';
import { sendManyEmails } from '../email-provider/send-many-emails';
import { type ApiClient } from '../types/api-client';
import { type AudienceFilter } from '../types/audience-filter';
import { type BroadcastBatchPayload } from '../types/broadcast-batch-payload';
import { type CampaignRow } from '../types/campaign-row';
import { type EmailSendDraft } from '../types/email-send-draft';
import { type MerchantEmailBuildResult } from '../types/merchant-email-build-result';
import { type MerchantRow } from '../types/merchant-row';
import { type OutgoingEmail } from '../types/outgoing-email';
import { type TemplateRow } from '../types/template-row';
import { parseAudienceFilter } from '../utils/parse-audience-filter.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { buildEmailUnsubscribeUrl } from './utils/build-email-unsubscribe-url.util';
import { createEmailSendRecords } from './utils/create-email-send-records.util';
import { enqueueBroadcastBatch } from './utils/enqueue-broadcast-batch.util';
import { fetchCampaign } from './utils/fetch-campaign.util';
import { fetchMerchantPage } from './utils/fetch-merchant-page.util';
import { fetchMerchantsByEmail } from './utils/fetch-merchants-by-email.util';
import { fetchSuppressedEmails } from './utils/fetch-suppressed-emails.util';
import { fetchTemplate } from './utils/fetch-template.util';
import { findAlreadyEmailedAddresses } from './utils/find-already-emailed-addresses.util';
import { prepareMerchantEmail } from './utils/prepare-merchant-email.util';
import { updateCampaign } from './utils/update-campaign.util';
import { createAppClient } from './utils/create-app-client.util';

type PreparedEntry = { merchantId: string | null; result: MerchantEmailBuildResult };

// The audience filter page: each merchant is its own recipient and owns its
// own unsubscribe link and merchant id.
const prepareFilterPage = async ({
  client,
  campaign,
  template,
  audienceFilter,
  pageSize,
  after,
}: {
  client: ApiClient;
  campaign: CampaignRow;
  template: TemplateRow;
  audienceFilter: AudienceFilter;
  pageSize: number;
  after?: string;
}): Promise<{ prepared: PreparedEntry[]; hasNextPage: boolean; nextAfter?: string }> => {
  const page = await fetchMerchantPage({
    client,
    audienceFilter,
    first: pageSize,
    after,
  });
  const merchants = (page.edges ?? []).map((edge) => edge.node);
  const prepared = merchants.map((merchant) => ({
    merchantId: merchant.id,
    result: prepareMerchantEmail({ campaign, template, merchant }),
  }));

  return {
    prepared,
    hasNextPage: page.pageInfo?.hasNextPage === true,
    nextAfter: page.pageInfo?.endCursor,
  };
};

// The manual list page: an address with a matching merchant uses that
// merchant's data and its existing unsubscribe link, same as a filtered
// broadcast would. One with no match gets a stub built from the sheet's own
// name column and an email-keyed unsubscribe link, since there is no
// merchant row for either to live on.
const prepareManualListPage = async ({
  client,
  campaign,
  template,
  pageIndex,
  pageSize,
}: {
  client: ApiClient;
  campaign: CampaignRow;
  template: TemplateRow;
  pageIndex: number;
  pageSize: number;
}): Promise<{ prepared: PreparedEntry[]; hasNextPage: boolean }> => {
  const allRecipients = campaign.manualRecipients ?? [];
  const pageStart = pageIndex * pageSize;
  const pageRecipients = allRecipients.slice(pageStart, pageStart + pageSize);
  const emails = pageRecipients.map((recipient) => recipient.email);
  const appIds = parseAudienceFilter(campaign.audienceFilter).appIds;

  const [{ byEmail: merchantsByEmail }, suppressedEmails] = await Promise.all([
    fetchMerchantsByEmail(client, emails, appIds),
    fetchSuppressedEmails(client, emails),
  ]);

  const prepared = pageRecipients.map((recipient) => {
    const matchedMerchant = merchantsByEmail.get(recipient.email);

    if (matchedMerchant !== undefined) {
      return {
        merchantId: matchedMerchant.id,
        result: prepareMerchantEmail({ campaign, template, merchant: matchedMerchant }),
      };
    }

    const stub: MerchantRow = {
      id: `manual:${recipient.email}`,
      name: recipient.name ?? undefined,
      contactName: recipient.name ?? undefined,
      storeName: recipient.name ?? undefined,
      email: { primaryEmail: recipient.email },
      emailUnsubscribed: suppressedEmails.has(recipient.email),
    };

    return {
      merchantId: null,
      result: prepareMerchantEmail({
        campaign,
        template,
        merchant: stub,
        unsubscribeUrl: buildEmailUnsubscribeUrl(recipient.email),
      }),
    };
  });

  return { prepared, hasNextPage: pageStart + pageSize < allRecipients.length };
};

const runBatch = async (client: ApiClient, payload: BroadcastBatchPayload) => {
  const { campaignId, runId, pageIndex, after } = payload;
  const pageSize = payload.pageSize ?? resolveBroadcastPageSize();
  const campaign = await fetchCampaign(client, campaignId);

  // Pausing or canceling is just a status change: the chain notices here and
  // stops before sending the next page.
  if (campaign?.status !== 'SENDING') {
    return {
      stopped: true,
      reason: `Campaign status is ${campaign?.status ?? 'missing'}`,
    };
  }

  const template = campaign.templateId
    ? await fetchTemplate(client, campaign.templateId)
    : null;

  if (template === null) {
    throw new Error('The campaign has no template.');
  }

  const isManualList = campaign.audienceMode === 'MANUAL_LIST';
  const { prepared, hasNextPage, nextAfter } = isManualList
    ? { ...(await prepareManualListPage({ client, campaign, template, pageIndex, pageSize })), nextAfter: undefined }
    : await prepareFilterPage({
        client,
        campaign,
        template,
        audienceFilter: parseAudienceFilter(campaign.audienceFilter),
        pageSize,
        after,
      });

  const alreadyEmailed = await findAlreadyEmailedAddresses({
    client,
    campaignId,
    emails: prepared
      .map(({ result }) => result.to)
      .filter((email) => email !== ''),
  });

  const outgoing: {
    merchantId: string | null;
    to: string;
    subject: string;
    email: OutgoingEmail;
  }[] = [];
  const records: EmailSendDraft[] = [];

  for (const { merchantId, result } of prepared) {
    if (result.kind === 'SKIPPED') {
      records.push({
        name: result.to,
        subject: template.subject ?? '',
        status: 'SKIPPED',
        trigger: 'BROADCAST',
        providerMessageId: '',
        errorMessage: result.reason,
        sentAt: null,
        campaignId,
        merchantId,
      });
      continue;
    }

    if (alreadyEmailed.has(result.to)) {
      continue;
    }

    alreadyEmailed.add(result.to);
    outgoing.push({
      merchantId,
      to: result.to,
      subject: result.subject,
      email: result.email,
    });
  }

  const results = await sendManyEmails(
    outgoing.map(({ email }) => email),
    `${campaignId}:${runId}:${pageIndex}`,
  );
  const sentAt = new Date().toISOString();

  outgoing.forEach(({ merchantId, to, subject }, index) => {
    const result = results[index];

    records.push({
      name: to,
      subject,
      status: result?.ok ? 'SENT' : 'FAILED',
      trigger: 'BROADCAST',
      providerMessageId: result?.ok ? result.id : '',
      errorMessage: result && !result.ok ? result.error : '',
      sentAt: result?.ok ? sentAt : null,
      campaignId,
      merchantId,
    });
  });

  await createEmailSendRecords(client, records);

  // A page where nothing got through means a setup problem (revoked key,
  // unverified domain) that the next page would hit too, so the run parks.
  const firstFailure = results.find((result) => !result.ok);

  if (
    results.length > 0 &&
    results.every((result) => !result.ok) &&
    firstFailure &&
    !firstFailure.ok
  ) {
    await updateCampaign(client, campaignId, {
      status: 'PAUSED',
      lastError: `Every email of a batch failed: ${firstFailure.error}`.slice(
        0,
        1000,
      ),
    });

    return { pageIndex, stopped: true, reason: firstFailure.error };
  }

  if (hasNextPage) {
    await enqueueBroadcastBatch({
      campaignId,
      runId,
      pageIndex: pageIndex + 1,
      pageSize,
      ...(nextAfter === undefined ? {} : { after: nextAfter }),
    });
  } else {
    await updateCampaign(client, campaignId, {
      status: 'SENT',
      completedAt: new Date().toISOString(),
    });
  }

  return {
    pageIndex,
    sent: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    skipped: records.filter((record) => record.status === 'SKIPPED').length,
    hasNextPage,
  };
};

const handler = async (payload: BroadcastBatchPayload) => {
  if (!payload?.campaignId || !payload.runId) {
    return { stopped: true, reason: 'campaignId and runId are required' };
  }

  const client = createAppClient();

  try {
    return await runBatch(client, {
      ...payload,
      pageIndex: payload.pageIndex ?? 0,
    });
  } catch (error) {
    // Parked as PAUSED with the reason, so the team sees it in the studio and
    // can resume once fixed; already-mailed addresses are skipped on resume.
    await updateCampaign(client, payload.campaignId, {
      status: 'PAUSED',
      lastError: readErrorMessage(error).slice(0, 1000),
    });

    throw error;
  }
};

export default defineLogicFunction({
  universalIdentifier: RUN_BROADCAST_BATCH_LOGIC_FUNCTION_UID,
  name: 'run-broadcast-batch',
  description:
    'Job: sends one page of a broadcast (audience filter or manual list) through the email provider, logs every send, then queues the next page.',
  timeoutSeconds: 120,
  handler,
});
