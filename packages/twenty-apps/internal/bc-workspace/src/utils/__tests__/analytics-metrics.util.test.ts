import { describe, expect, it } from 'vitest';

import { computeAnalytics, isTaskOpenAt } from '../analytics-metrics.util';
import {
  buildActivity,
  buildClient,
  buildDataset,
  buildEvent,
  buildIssue,
  buildMerchant,
  buildReview,
  buildTask,
  OCTOBER,
} from './analytics-fixtures';

describe('upgrade attribution', () => {
  it('counts an independent upgrade in the portfolio, not as BC influenced (UAT-13)', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        subscriptionEvents: [buildEvent({ isBcInfluenced: false })],
      }),
    );

    expect(kpis.portfolioUpgrades?.value).toBe(1);
    expect(kpis.bcInfluencedUpgrades?.value).toBe(0);
  });

  it('gives no credit when the only outreach came after the upgrade (UAT-14)', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        activities: [buildActivity({ occurredAt: '2026-10-20T00:00:00.000Z' })],
        subscriptionEvents: [
          buildEvent({ isBcInfluenced: true, attributedMemberId: 'tom' }),
        ],
      }),
    );

    expect(kpis.bcInfluencedUpgrades?.value).toBe(0);
    expect(kpis.portfolioUpgrades?.value).toBe(1);
  });

  it('credits an upgrade once when the BC reached out before it (UAT-15)', () => {
    const { kpis, records } = computeAnalytics(
      buildDataset({
        activities: [
          buildActivity({ id: 'a1', occurredAt: '2026-10-01T00:00:00.000Z' }),
          buildActivity({ id: 'a2', occurredAt: '2026-10-05T00:00:00.000Z' }),
        ],
        subscriptionEvents: [
          buildEvent({ isBcInfluenced: true, attributedMemberId: 'tom' }),
        ],
      }),
    );

    expect(kpis.bcInfluencedUpgrades?.value).toBe(1);
    expect(records.bcInfluencedUpgrades.map((event) => event.id)).toEqual([
      'event-1',
    ]);
  });

  it('keeps credit with the BC who acted after the client moved to another PIC', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        clients: [buildClient({ picId: 'anna' })],
        activities: [buildActivity({ occurredAt: '2026-10-01T00:00:00.000Z' })],
        subscriptionEvents: [
          buildEvent({ isBcInfluenced: true, attributedMemberId: 'tom' }),
        ],
      }),
    );

    expect(kpis.bcInfluencedUpgrades?.value).toBe(1);
    expect(kpis.portfolioUpgrades?.value).toBe(0);
  });
});

describe('reviews acquired', () => {
  it('counts verified reviews with outreach before publication, per app', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        appName: 'BLOY',
        activities: [buildActivity({ occurredAt: '2026-10-10T00:00:00.000Z' })],
        reviews: [
          buildReview({}),
          buildReview({ id: 'review-mida', appName: 'MIDA' }),
          buildReview({ id: 'review-unverified', isVerified: false }),
          buildReview({ id: 'review-no-evidence', evidenceActivityId: null }),
        ],
      }),
    );

    expect(kpis.reviewsAcquired?.value).toBe(1);
  });

  it('refuses credit when the outreach came after the review', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        activities: [buildActivity({ occurredAt: '2026-10-25T00:00:00.000Z' })],
        reviews: [buildReview({})],
      }),
    );

    expect(kpis.reviewsAcquired?.value).toBe(0);
  });
});

describe('event, snapshot and engagement metrics (UAT-29)', () => {
  it('counts events by date in range and open tasks as of the period end', () => {
    const tasks = [
      buildTask({ id: 'before', createdAt: '2026-09-20T00:00:00.000Z' }),
      buildTask({ id: 'inside', createdAt: '2026-10-05T00:00:00.000Z' }),
      buildTask({
        id: 'closed-after-end',
        status: 'COMPLETED',
        createdAt: '2026-10-06T00:00:00.000Z',
        completedAt: '2026-11-03T00:00:00.000Z',
      }),
      buildTask({
        id: 'closed-inside',
        status: 'COMPLETED',
        createdAt: '2026-10-06T00:00:00.000Z',
        completedAt: '2026-10-08T00:00:00.000Z',
      }),
      buildTask({ id: 'after', createdAt: '2026-11-05T00:00:00.000Z' }),
    ];
    const { kpis } = computeAnalytics(buildDataset({ tasks }));

    expect(kpis.tasksCreated?.value).toBe(3);
    expect(kpis.tasksCompleted?.value).toBe(1);
    expect(kpis.openTasks?.value).toBe(3);
  });

  it('treats a task cancelled before the end as closed', () => {
    expect(
      isTaskOpenAt(
        buildTask({
          status: 'CANCELLED',
          history: [
            {
              at: '2026-10-20T00:00:00.000Z',
              actorMemberId: 'tom',
              action: 'X',
              to: 'CANCELLED',
            },
          ],
        }),
        OCTOBER.end,
      ),
    ).toBe(false);
  });

  it('measures coverage over clients managed at the period end', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        clients: [
          buildClient({}),
          buildClient({ id: 'client-2' }),
          buildClient({
            id: 'client-later',
            assignedAt: '2026-11-10T00:00:00.000Z',
          }),
        ],
        activities: [
          buildActivity({ id: 'a1', externalId: 'crisp-1' }),
          buildActivity({ id: 'a2', externalId: 'crisp-1' }),
          buildActivity({ id: 'a3', activityType: 'STATUS_CHANGE' }),
        ],
      }),
    );

    expect(kpis.managedClients?.value).toBe(2);
    expect(kpis.clientsContacted?.value).toBe(1);
    expect(kpis.contactCoverage?.value).toBe(0.5);
    expect(kpis.bcInteractions?.value).toBe(1);
  });

  it('counts a client as recovered only when its last open issue is resolved', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        clients: [buildClient({}), buildClient({ id: 'client-2' })],
        issues: [
          buildIssue({
            id: 'a',
            status: 'RESOLVED',
            resolvedAt: '2026-10-10T00:00:00.000Z',
            resolvedByMemberId: 'tom',
          }),
          buildIssue({ id: 'b', status: 'OPEN' }),
          buildIssue({
            id: 'c',
            vipClientId: 'client-2',
            status: 'RESOLVED',
            resolvedAt: '2026-10-12T00:00:00.000Z',
            resolvedByMemberId: 'tom',
          }),
        ],
      }),
    );

    expect(kpis.recoveredClients?.value).toBe(1);
    expect(kpis.issuesResolved?.value).toBe(2);
    expect(kpis.newIssues?.value).toBe(3);
  });

  it('separates first assignments from transfers', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        activities: [
          buildActivity({
            id: 'p1',
            activityType: 'PIC_CHANGE',
            isBcAuthored: false,
            actorMemberId: 'admin',
            metadata: { fromMemberId: null, toMemberId: 'tom' },
          }),
          buildActivity({
            id: 'p2',
            activityType: 'PIC_CHANGE',
            vipClientId: 'client-2',
            isBcAuthored: false,
            metadata: { fromMemberId: 'anna', toMemberId: 'tom' },
          }),
        ],
      }),
    );

    expect(kpis.newVipClients?.value).toBe(1);
    expect(kpis.transferredClients?.value).toBe(1);
  });

  it('limits the portfolio to clients of the selected product', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        appName: 'MIDA',
        clients: [buildClient({}), buildClient({ id: 'client-2' })],
        merchants: [
          buildMerchant({}),
          buildMerchant({
            id: 'm2',
            vipClientId: 'client-2',
            app: { id: 'app-mida', name: 'MIDA' },
          }),
        ],
      }),
    );

    expect(kpis.managedClients?.value).toBe(1);
  });
});
