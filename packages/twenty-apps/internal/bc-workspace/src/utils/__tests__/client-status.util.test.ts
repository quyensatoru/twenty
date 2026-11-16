import { describe, expect, it } from 'vitest';

import {
  computeAppHealth,
  computeRelationshipStatus,
  computeReviewState,
  readSubscriptionLifecycle,
} from '../client-status.util';

const active = { using: true, uninstalledAt: null };
const uninstalled = { using: false, uninstalledAt: '2026-10-01T00:00:00.000Z' };
const now = '2026-11-10T00:00:00.000Z';

describe('computeRelationshipStatus', () => {
  it('keeps a client with an open issue At Risk over a pending reply', () => {
    expect(
      computeRelationshipStatus({
        openIssueCount: 1,
        merchants: [active],
        awaitingReplySince: '2026-11-01T00:00:00.000Z',
        now,
        noReplyHours: 72,
      }),
    ).toBe('AT_RISK');
  });

  it('keeps an issue-holding client At Risk even when every app is gone', () => {
    expect(
      computeRelationshipStatus({
        openIssueCount: 2,
        merchants: [uninstalled],
        awaitingReplySince: null,
        now,
        noReplyHours: 72,
      }),
    ).toBe('AT_RISK');
  });

  it('marks a client Inactive only when no app is live', () => {
    expect(
      computeRelationshipStatus({
        openIssueCount: 0,
        merchants: [uninstalled, active],
        awaitingReplySince: null,
        now,
        noReplyHours: 72,
      }),
    ).toBe('ACTIVE');
    expect(
      computeRelationshipStatus({
        openIssueCount: 0,
        merchants: [uninstalled],
        awaitingReplySince: null,
        now,
        noReplyHours: 72,
      }),
    ).toBe('INACTIVE');
  });

  it('waits for the client, then asks for a follow-up after the window', () => {
    const base = {
      openIssueCount: 0,
      merchants: [active],
      noReplyHours: 72,
      now,
    };

    expect(
      computeRelationshipStatus({
        ...base,
        awaitingReplySince: '2026-11-08T00:00:01.000Z',
      }),
    ).toBe('WAITING_FOR_CLIENT');
    expect(
      computeRelationshipStatus({
        ...base,
        awaitingReplySince: '2026-11-07T00:00:00.000Z',
      }),
    ).toBe('FOLLOW_UP');
  });

  it('does not force a client with no linked app Inactive', () => {
    expect(
      computeRelationshipStatus({
        openIssueCount: 0,
        merchants: [],
        awaitingReplySince: null,
        now,
        noReplyHours: 72,
      }),
    ).toBe('ACTIVE');
  });
});

describe('computeAppHealth', () => {
  it('marks only the app the issue names At Risk', () => {
    const openIssues = [{ appNames: ['BLOY'] }];

    expect(computeAppHealth({ merchant: active, appName: 'bloy', openIssues })).toBe('AT_RISK');
    expect(computeAppHealth({ merchant: active, appName: 'MIDA', openIssues })).toBe('HEALTHY');
    expect(computeAppHealth({ merchant: uninstalled, appName: 'BLOY', openIssues })).toBe(
      'INACTIVE',
    );
  });
});

describe('computeReviewState', () => {
  it('never lets a review of another app satisfy this one', () => {
    const reviews = [{ appName: 'MIDA' }];

    expect(computeReviewState({ merchant: active, appName: 'MIDA', reviews })).toBe('REVIEWED');
    expect(computeReviewState({ merchant: active, appName: 'FRAUD', reviews })).toBe(
      'NEEDS_REVIEW',
    );
    expect(computeReviewState({ merchant: uninstalled, appName: 'FRAUD', reviews })).toBe(
      'NOT_ELIGIBLE',
    );
  });
});

describe('readSubscriptionLifecycle', () => {
  it('reads Trial from the catalog and Cancelled from a free plan after paying', () => {
    expect(readSubscriptionLifecycle(uninstalled)).toBe('UNINSTALLED');
    expect(readSubscriptionLifecycle(active, { plan: { isTrial: true, monthlyPrice: 0 } })).toBe(
      'TRIAL',
    );
    expect(
      readSubscriptionLifecycle(active, {
        plan: { isTrial: false, monthlyPrice: 0 },
        hadPaidPlan: true,
      }),
    ).toBe('CANCELLED');
    expect(
      readSubscriptionLifecycle(active, { plan: { isTrial: false, monthlyPrice: 0 } }),
    ).toBe('ACTIVE');
  });

  it('treats a cancelled subscription as no longer eligible (UAT-03)', () => {
    const cancelled = { ...active, lifecycle: 'CANCELLED' as const };
    const trial = { ...active, lifecycle: 'TRIAL' as const };

    expect(
      computeRelationshipStatus({
        openIssueCount: 0,
        merchants: [cancelled, trial],
        awaitingReplySince: null,
        now,
        noReplyHours: 72,
      }),
    ).toBe('ACTIVE');
    expect(
      computeRelationshipStatus({
        openIssueCount: 0,
        merchants: [cancelled],
        awaitingReplySince: null,
        now,
        noReplyHours: 72,
      }),
    ).toBe('INACTIVE');
    expect(computeReviewState({ merchant: cancelled, appName: 'MIDA', reviews: [] })).toBe(
      'NOT_ELIGIBLE',
    );
  });
});
