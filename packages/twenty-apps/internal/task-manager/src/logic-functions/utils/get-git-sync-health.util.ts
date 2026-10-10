import { getJobs, kv } from 'twenty-sdk/logic-function';
import {
  getGitSyncHealthKey,
  getGitWebhookHealthKey,
  getGitSyncJobKey,
  type GitSyncHealth,
} from './git-kv.util';

export const getGitSyncHealth = async (repositoryId: string) => {
  const [sync, webhook, jobId] = await Promise.all([
    kv.get<GitSyncHealth>(getGitSyncHealthKey(repositoryId)),
    kv.get<GitSyncHealth>(getGitWebhookHealthKey(repositoryId)),
    kv.get<string>(getGitSyncJobKey(repositoryId)),
  ]);
  const jobs = typeof jobId === 'string' ? await getJobs([jobId]) : [];
  const job = jobs[0];
  return {
    syncState: job?.state ?? null,
    lastSyncedAt: sync?.lastSyncedAt ?? null,
    lastWebhookAt: webhook?.lastSyncedAt ?? null,
    syncError:
      job?.state === 'FAILED'
        ? (job.failedReason ?? sync?.error)
        : (sync?.error ?? null),
    webhookError: webhook?.error ?? null,
    liveSyncError: sync?.liveSyncError ?? null,
    unknownIssueKeys: [
      ...new Set([
        ...(sync?.unknownIssueKeys ?? []),
        ...(webhook?.unknownIssueKeys ?? []),
      ]),
    ],
  };
};
