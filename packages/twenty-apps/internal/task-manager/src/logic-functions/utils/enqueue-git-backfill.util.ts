import { getGitSyncJobKey } from './git-kv.util';
import { enqueueJobs, kv } from 'twenty-sdk/logic-function';

import { GIT_BACKFILL_LOGIC_FUNCTION_UID } from '../../constants/universal-identifiers';

// One backfill job per linked repository: bounded provider reads (recent
// branches, pull requests and commits), paced by the job queue rather than
// the link route's timeout.
export const enqueueGitBackfill = async ({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<void> => {
  const result = await enqueueJobs({
    logicFunctionUniversalIdentifier: GIT_BACKFILL_LOGIC_FUNCTION_UID,
    payloads: [{ repositoryId }],
    retryLimit: 3,
  });

  if (!result.enqueued) {
    throw new Error('Failed to enqueue the git backfill job.');
  }
  await kv.set(getGitSyncJobKey(repositoryId), result.jobIds[0]);
};
