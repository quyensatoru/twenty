import { type DevelopmentDeliveryRow } from '../../types/development-delivery';
import { getLatestDevelopmentDeliveries } from '../../utils/summarize-development-deliveries.util';
import type {
  DevelopmentLinkRow,
  DevelopmentRepositoryRow,
} from '../hooks/use-development';

export type DevelopmentActivitySummary = {
  pullRequest: { status: string; externalId: string | null } | null;
  build: { status: string } | null;
  deployment: {
    status: string;
    environmentName: string | null;
    environmentType: string | null;
  } | null;
};

export type DevelopmentSyncStatus =
  { kind: 'attention' } | { kind: 'live'; syncedAt: string | null } | null;

const readTime = (value: string | null | undefined): number => {
  const time = typeof value === 'string' ? Date.parse(value) : Number.NaN;

  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
};

// The three answers a reader wants before the detail: is there a pull request
// and where is it, did the last build pass, and where was it last deployed.
export const summarizeDevelopmentActivity = (
  links: DevelopmentLinkRow[],
  deliveries: DevelopmentDeliveryRow[],
): DevelopmentActivitySummary => {
  let latestPullRequest: DevelopmentLinkRow | null = null;

  for (const link of links) {
    if (link.linkType !== 'PULL_REQUEST') {
      continue;
    }

    if (
      latestPullRequest === null ||
      readTime(link.createdAt) > readTime(latestPullRequest.createdAt)
    ) {
      latestPullRequest = link;
    }
  }

  const latestDeliveries = getLatestDevelopmentDeliveries(deliveries);
  const latestBuild = latestDeliveries.find(
    (delivery) => delivery.deliveryType === 'BUILD',
  );
  const latestDeployment = latestDeliveries.find(
    (delivery) => delivery.deliveryType === 'DEPLOYMENT',
  );

  return {
    pullRequest:
      latestPullRequest === null
        ? null
        : {
            status: latestPullRequest.status ?? 'OPEN',
            externalId: latestPullRequest.externalId ?? null,
          },
    build: latestBuild === undefined ? null : { status: latestBuild.status },
    deployment:
      latestDeployment === undefined
        ? null
        : {
            status: latestDeployment.status,
            environmentName: latestDeployment.environmentName,
            environmentType: latestDeployment.environmentType,
          },
  };
};

export const hasDevelopmentActivitySummary = (
  summary: DevelopmentActivitySummary,
): boolean =>
  summary.pullRequest !== null ||
  summary.build !== null ||
  summary.deployment !== null;

export const hasRepositorySyncProblem = (
  repository: DevelopmentRepositoryRow,
): boolean =>
  [
    repository.syncError,
    repository.webhookError,
    repository.liveSyncError,
  ].some((error) => typeof error === 'string' && error !== '');

// A problem on any repository outranks the others being live: the panel is
// only as current as its least current repository.
export const readDevelopmentSyncStatus = (
  repositories: DevelopmentRepositoryRow[],
): DevelopmentSyncStatus => {
  if (repositories.some(hasRepositorySyncProblem)) {
    return { kind: 'attention' };
  }

  const liveRepositories = repositories.filter(
    (repository) =>
      repository.isActive !== false && repository.hasWebhook === true,
  );

  if (liveRepositories.length === 0) {
    return null;
  }

  let syncedAt: string | null = null;

  for (const repository of liveRepositories) {
    for (const candidate of [
      repository.lastWebhookAt,
      repository.lastSyncedAt,
    ]) {
      if (
        typeof candidate === 'string' &&
        readTime(candidate) > readTime(syncedAt)
      ) {
        syncedAt = candidate;
      }
    }
  }

  return { kind: 'live', syncedAt };
};
