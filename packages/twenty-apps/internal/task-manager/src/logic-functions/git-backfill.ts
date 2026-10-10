import {
  enrichDevelopmentDelivery,
  listRecentDevelopmentDeliveries,
} from './utils/git-delivery-api.util';
import { saveDevelopmentDeliveries } from './utils/save-development-deliveries.util';
import { repairGitWebhook } from './utils/repair-git-webhook.util';
import { getGitSyncHealthKey } from './utils/git-kv.util';
import { getActiveGitRepository } from './utils/get-active-git-repository.util';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { getConnection, kv } from 'twenty-sdk/logic-function';

import { GIT_BACKFILL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import {
  listGitHubBranches,
  listGitHubCommits,
  listGitHubPulls,
} from './utils/github-api.util';
import type {
  GitBranchSummary,
  GitCommitSummary,
  GitPullRequestSummary,
} from './utils/git-api.util';
import {
  listGitLabBranches,
  listGitLabCommits,
  listGitLabMergeRequests,
} from './utils/gitlab-api.util';
import { upsertDevelopmentReferences } from './utils/upsert-development-links.util';

type GitBackfillPayload = { repositoryId?: string };

// One bounded pass over a freshly linked repo: recent branches, pull/merge
// requests and default-branch commits, every issue key found becoming a link.
// The push webhook keeps it fresh afterwards, so the backfill stays shallow
// on purpose instead of walking full history against the rate limit.
export const gitBackfillHandler = async (payload: GitBackfillPayload) => {
  const repositoryId = payload.repositoryId;

  if (typeof repositoryId !== 'string' || repositoryId === '') {
    throw new Error('Git backfill requires a repositoryId.');
  }

  const client = new CoreApiClient({ runAs: 'application' });

  const repository = await getActiveGitRepository(client, repositoryId);
  if (repository === null)
    return { success: true as const, repositoryId, skipped: true as const };
  const { slug, externalId, provider, connectionId, remoteUrl, baseUrl } =
    repository;

  if (
    slug === null ||
    provider === null ||
    connectionId === null ||
    (provider !== 'GITHUB' && provider !== 'GITLAB')
  ) {
    throw new Error('The backfilled repository link is incomplete.');
  }

  try {
    const isGitHub = provider === 'GITHUB';
    // gitlab.com and self-hosted GitLab share the API shape; only the root
    // differs, and the row remembers which instance it was linked from.
    const gitlabBaseUrl = baseUrl ?? 'https://gitlab.com';

    const connection = await getConnection(connectionId);
    const accessToken = connection.accessToken;

    const branches: GitBranchSummary[] = isGitHub
      ? await listGitHubBranches({
          accessToken,
          connectionId,
          slug,
          baseUrl: baseUrl ?? undefined,
        })
      : externalId === null
        ? []
        : await listGitLabBranches({
            accessToken,
            connectionId,
            baseUrl: gitlabBaseUrl,
            projectId: externalId,
          });

    const pulls: GitPullRequestSummary[] = isGitHub
      ? await listGitHubPulls({
          accessToken,
          connectionId,
          slug,
          baseUrl: baseUrl ?? undefined,
        })
      : externalId === null
        ? []
        : await listGitLabMergeRequests({
            accessToken,
            connectionId,
            baseUrl: gitlabBaseUrl,
            projectId: externalId,
          });

    const commits: GitCommitSummary[] = isGitHub
      ? await listGitHubCommits({
          accessToken,
          connectionId,
          slug,
          baseUrl: baseUrl ?? undefined,
        })
      : externalId === null
        ? []
        : await listGitLabCommits({
            accessToken,
            connectionId,
            baseUrl: gitlabBaseUrl,
            projectId: externalId,
          });

    let liveSyncError: string | null = null;
    try {
      await repairGitWebhook({ repository, accessToken });
    } catch (error) {
      liveSyncError =
        error instanceof Error ? error.message : 'Webhook repair failed.';
    }
    if ((await getActiveGitRepository(client, repositoryId)) === null)
      return { success: true as const, repositoryId, skipped: true as const };
    const outcome = await upsertDevelopmentReferences({
      client: client as ApiClient,
      repositoryId,
      defaultRepositorySlug: slug,
      references: [
        ...branches.map((branch) => ({
          kind: 'branch',
          title: branch.name,
          url: toBranchUrl(provider, remoteUrl, branch.name),
          externalId: branch.name,
          status: 'ACTIVE',
        })),
        ...pulls.map((pull) => ({
          kind: 'pull-request',
          title: pull.title,
          url: pull.url,
          status: pull.status,
          externalId: pull.externalId,
          authorName: pull.authorName,
          text: pull.branchName,
        })),
        ...commits.map((commit) => ({
          kind: 'commit',
          title: commit.message,
          url: commit.url,
          externalId: commit.sha,
          authorName: commit.authorName,
        })),
      ],
    });

    const deliveryEvents = await listRecentDevelopmentDeliveries({
      repository,
      accessToken,
    });
    const enriched = [];
    for (const delivery of deliveryEvents)
      enriched.push(
        await enrichDevelopmentDelivery({ repository, accessToken, delivery }),
      );
    if ((await getActiveGitRepository(client, repositoryId)) === null)
      return { success: true as const, repositoryId, skipped: true as const };
    const deliveries = await saveDevelopmentDeliveries({
      client,
      repositoryId,
      deliveries: enriched,
    });
    await kv.set(getGitSyncHealthKey(repositoryId), {
      lastSyncedAt: new Date().toISOString(),
      error: null,
      unknownIssueKeys: outcome.unknownIssueKeys,
      liveSyncError,
    });
    return { success: true as const, repositoryId, ...outcome, deliveries };
  } catch (error) {
    const previousHealth = await kv.get<{ lastSyncedAt: string | null }>(
      getGitSyncHealthKey(repositoryId),
    );
    await kv.set(getGitSyncHealthKey(repositoryId), {
      lastSyncedAt: previousHealth?.lastSyncedAt ?? null,
      error: error instanceof Error ? error.message : 'Git sync failed.',
    });
    throw error;
  }
};

const toBranchUrl = (
  provider: string,
  remoteUrl: string | null,
  branch: string,
): string | null => {
  if (remoteUrl === null) {
    return null;
  }

  const base = remoteUrl.replace(/\/+$/, '');

  return provider === 'GITLAB'
    ? `${base}/-/tree/${encodeURIComponent(branch)}`
    : `${base}/tree/${encodeURIComponent(branch)}`;
};

export default defineLogicFunction({
  universalIdentifier: GIT_BACKFILL_LOGIC_FUNCTION_UID,
  name: 'git-backfill',
  description: 'Job: backfills one linked repo into development links.',
  timeoutSeconds: 300,
  handler: gitBackfillHandler,
});
