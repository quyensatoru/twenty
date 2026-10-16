import { describe, expect, it } from 'vitest';

import { type DevelopmentDeliveryRow } from '../../../types/development-delivery';
import {
  hasDevelopmentActivitySummary,
  readDevelopmentSyncStatus,
  summarizeDevelopmentActivity,
} from '../summarize-development-activity.util';

const buildDelivery = (
  overrides: Partial<DevelopmentDeliveryRow>,
): DevelopmentDeliveryRow => ({
  id: 'delivery',
  repositoryId: 'repo-1',
  deliveryType: 'BUILD',
  externalId: 'run-1',
  eventId: '1',
  title: 'CI',
  status: 'SUCCESSFUL',
  commitSha: null,
  branchName: null,
  pipelineId: 'ci',
  environmentName: null,
  environmentType: null,
  occurredAt: '2026-10-16T10:00:00.000Z',
  startedAt: null,
  url: null,
  ...overrides,
});

describe('summarizeDevelopmentActivity', () => {
  it('reports nothing for an issue without activity', () => {
    const summary = summarizeDevelopmentActivity([], []);

    expect(summary).toEqual({
      pullRequest: null,
      build: null,
      deployment: null,
    });
    expect(hasDevelopmentActivitySummary(summary)).toBe(false);
  });

  it('takes the newest pull request and ignores branches and commits', () => {
    const summary = summarizeDevelopmentActivity(
      [
        {
          id: 'pr-old',
          linkType: 'PULL_REQUEST',
          status: 'MERGED',
          externalId: '400',
          createdAt: '2026-10-10T10:00:00.000Z',
        },
        {
          id: 'branch',
          linkType: 'BRANCH',
          status: 'ACTIVE',
          createdAt: '2026-10-16T10:00:00.000Z',
        },
        {
          id: 'pr-new',
          linkType: 'PULL_REQUEST',
          status: 'OPEN',
          externalId: '412',
          createdAt: '2026-10-15T10:00:00.000Z',
        },
      ],
      [],
    );

    expect(summary.pullRequest).toEqual({ status: 'OPEN', externalId: '412' });
    expect(hasDevelopmentActivitySummary(summary)).toBe(true);
  });

  it('takes the newest build and the newest deployment', () => {
    const summary = summarizeDevelopmentActivity(
      [],
      [
        buildDelivery({
          id: 'build-old',
          externalId: 'run-1',
          status: 'SUCCESSFUL',
          occurredAt: '2026-10-16T08:00:00.000Z',
        }),
        buildDelivery({
          id: 'build-new',
          externalId: 'run-2',
          status: 'FAILED',
          occurredAt: '2026-10-16T09:40:00.000Z',
        }),
        buildDelivery({
          id: 'deploy',
          deliveryType: 'DEPLOYMENT',
          externalId: 'deploy-1',
          status: 'IN_PROGRESS',
          environmentName: 'Staging',
          environmentType: 'STAGING',
          occurredAt: '2026-10-16T09:00:00.000Z',
        }),
      ],
    );

    expect(summary.build).toEqual({ status: 'FAILED' });
    expect(summary.deployment).toEqual({
      status: 'IN_PROGRESS',
      environmentName: 'Staging',
      environmentType: 'STAGING',
    });
  });
});

describe('readDevelopmentSyncStatus', () => {
  it('is silent without a live repository', () => {
    expect(readDevelopmentSyncStatus([])).toBeNull();
    expect(
      readDevelopmentSyncStatus([
        { id: 'repo-1', isActive: true, hasWebhook: false },
        { id: 'repo-2', isActive: false, hasWebhook: true },
      ]),
    ).toBeNull();
  });

  it('reports the newest sync of the live repositories', () => {
    expect(
      readDevelopmentSyncStatus([
        {
          id: 'repo-1',
          isActive: true,
          hasWebhook: true,
          lastSyncedAt: '2026-10-16T09:00:00.000Z',
          lastWebhookAt: '2026-10-16T10:02:00.000Z',
        },
        {
          id: 'repo-2',
          isActive: true,
          hasWebhook: true,
          lastSyncedAt: '2026-10-16T09:30:00.000Z',
        },
      ]),
    ).toEqual({ kind: 'live', syncedAt: '2026-10-16T10:02:00.000Z' });
  });

  it('asks for attention when any repository has a sync problem', () => {
    expect(
      readDevelopmentSyncStatus([
        { id: 'repo-1', isActive: true, hasWebhook: true },
        { id: 'repo-2', isActive: true, webhookError: 'Forbidden' },
      ]),
    ).toEqual({ kind: 'attention' });
  });
});
