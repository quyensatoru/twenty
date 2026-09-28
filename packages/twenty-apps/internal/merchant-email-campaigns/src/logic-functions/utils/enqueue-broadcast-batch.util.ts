import { enqueueJobs } from 'twenty-sdk/logic-function';

import { RUN_BROADCAST_BATCH_LOGIC_FUNCTION_UID } from '../../constants/universal-identifiers';
import { type BroadcastBatchPayload } from '../../types/broadcast-batch-payload';

// The job id makes a page enqueue at most once per run, so a batch job that is
// retried after it already queued its successor does not fork the chain.
export const enqueueBroadcastBatch = async (
  payload: BroadcastBatchPayload,
): Promise<void> => {
  await enqueueJobs({
    logicFunctionUniversalIdentifier: RUN_BROADCAST_BATCH_LOGIC_FUNCTION_UID,
    retryLimit: 2,
    jobs: [
      {
        payload,
        jobId: `${payload.campaignId}.${payload.runId}.${payload.pageIndex}`,
      },
    ],
  });
};
