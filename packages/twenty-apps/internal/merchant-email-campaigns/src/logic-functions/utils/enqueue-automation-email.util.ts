import { enqueueJobs } from 'twenty-sdk/logic-function';

import { SEND_AUTOMATION_EMAIL_LOGIC_FUNCTION_UID } from '../../constants/universal-identifiers';
import { type CampaignRow } from '../../types/campaign-row';
import { buildAutomationJobId } from '../../utils/build-automation-job-id.util';

const MINUTE_MS = 60_000;

export const enqueueAutomationEmail = async ({
  campaign,
  merchantId,
  trigger,
  eventProperties,
}: {
  campaign: CampaignRow;
  merchantId: string;
  trigger: string;
  eventProperties?: Record<string, string>;
}): Promise<number> => {
  const result = await enqueueJobs({
    logicFunctionUniversalIdentifier: SEND_AUTOMATION_EMAIL_LOGIC_FUNCTION_UID,
    delayMs: Math.max(0, campaign.delayMinutes ?? 0) * MINUTE_MS,
    retryLimit: 3,
    jobs: [
      {
        payload: {
          campaignId: campaign.id,
          merchantId,
          trigger,
          ...(eventProperties === undefined ? {} : { eventProperties }),
        },
        jobId: buildAutomationJobId({
          campaignId: campaign.id,
          merchantId,
          trigger: trigger.replace(/[^\w.-]/g, '_'),
        }),
      },
    ],
  });

  return result.enqueuedJobsCount;
};
