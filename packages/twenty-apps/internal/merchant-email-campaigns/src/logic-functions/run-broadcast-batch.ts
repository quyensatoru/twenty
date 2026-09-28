import { defineLogicFunction } from 'twenty-sdk/define';

import { BROADCAST_BATCH_SIZE } from '../constants/send-limits';
import { RUN_BROADCAST_BATCH_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { sendManyEmails } from '../email-provider/send-many-emails';
import { type BroadcastBatchPayload } from '../types/broadcast-batch-payload';
import { type EmailSendDraft } from '../types/email-send-draft';
import { type OutgoingEmail } from '../types/outgoing-email';
import { parseAudienceFilter } from '../utils/parse-audience-filter.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { createEmailSendRecords } from './utils/create-email-send-records.util';
import { enqueueBroadcastBatch } from './utils/enqueue-broadcast-batch.util';
import { fetchCampaign } from './utils/fetch-campaign.util';
import { fetchMerchantPage } from './utils/fetch-merchant-page.util';
import { fetchTemplate } from './utils/fetch-template.util';
import { findAlreadyEmailedAddresses } from './utils/find-already-emailed-addresses.util';
import { prepareMerchantEmail } from './utils/prepare-merchant-email.util';
import { updateCampaign } from './utils/update-campaign.util';
import { createAppClient } from './utils/create-app-client.util';

const runBatch = async (client: unknown, payload: BroadcastBatchPayload) => {
  const { campaignId, runId, pageIndex, after } = payload;
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

  const page = await fetchMerchantPage({
    client,
    audienceFilter: parseAudienceFilter(campaign.audienceFilter),
    first: BROADCAST_BATCH_SIZE,
    after,
  });
  const merchants = (page.edges ?? []).map((edge) => edge.node);
  const prepared = merchants.map((merchant) => ({
    merchant,
    result: prepareMerchantEmail({ campaign, template, merchant }),
  }));
  const alreadyEmailed = await findAlreadyEmailedAddresses({
    client,
    campaignId,
    emails: prepared
      .map(({ result }) => result.to)
      .filter((email) => email !== ''),
  });

  const outgoing: {
    merchantId: string;
    to: string;
    subject: string;
    email: OutgoingEmail;
  }[] = [];
  const records: EmailSendDraft[] = [];

  for (const { merchant, result } of prepared) {
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
        merchantId: merchant.id,
      });
      continue;
    }

    if (alreadyEmailed.has(result.to)) {
      continue;
    }

    alreadyEmailed.add(result.to);
    outgoing.push({
      merchantId: merchant.id,
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

  const nextCursor = page.pageInfo?.hasNextPage
    ? page.pageInfo.endCursor
    : undefined;

  if (nextCursor !== undefined) {
    await enqueueBroadcastBatch({
      campaignId,
      runId,
      pageIndex: pageIndex + 1,
      after: nextCursor,
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
    hasNextPage: nextCursor !== undefined,
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
    'Job: sends one page of a broadcast through Resend, logs every send, then queues the next page.',
  timeoutSeconds: 120,
  handler,
});
