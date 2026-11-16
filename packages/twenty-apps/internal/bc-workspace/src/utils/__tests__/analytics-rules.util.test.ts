import { describe, expect, it } from 'vitest';

import {
  type BcPaymentRecord,
  type BcPlanRecord,
} from '../../types/bc-records';
import { computeFinance } from '../analytics-finance.util';
import { computeAnalytics } from '../analytics-metrics.util';
import { buildOwnershipSpans } from '../analytics-ownership.util';
import {
  buildActivity,
  buildClient,
  buildDataset,
  buildEvent,
  buildIssue,
  buildMerchant,
  buildTask,
  OCTOBER,
} from './analytics-fixtures';

const picChange = (
  id: string,
  at: string,
  from: string | null,
  to: string | null,
) =>
  buildActivity({
    id,
    activityType: 'PIC_CHANGE',
    isBcAuthored: false,
    actorMemberId: null,
    occurredAt: at,
    metadata: { fromMemberId: from, toMemberId: to },
  });

const plan = (
  planCode: string,
  monthlyPrice: number,
  appName = 'BLOY',
): BcPlanRecord => ({
  id: `${appName}-${planCode}`,
  name: planCode,
  appName,
  planCode,
  monthlyPrice,
  rank: null,
  usageAllowance: null,
  isTrial: false,
});

const payment = (overrides: Partial<BcPaymentRecord>): BcPaymentRecord => ({
  id: 'p1',
  name: null,
  appName: 'BLOY',
  kind: 'CHARGE',
  amount: 100,
  originalAmount: null,
  currencyCode: 'USD',
  paidAt: '2026-05-01T00:00:00.000Z',
  invoiceId: null,
  externalId: null,
  isOneTime: false,
  vipClientId: 'client-1',
  ...overrides,
});

describe('point-in-time ownership (A-05, UAT-29)', () => {
  const midPeriodMove = [
    picChange('p1', '2026-01-01T00:00:00.000Z', null, 'tom'),
    picChange('p2', '2026-10-15T00:00:00.000Z', 'tom', 'anna'),
  ];

  it('moves the snapshot to the new PIC after a mid-period reassignment', () => {
    const client = buildClient({ picId: 'anna' });
    const forTom = computeAnalytics(
      buildDataset({
        clients: [client],
        activities: midPeriodMove,
        memberIds: ['tom'],
      }),
    );
    const forAnna = computeAnalytics(
      buildDataset({
        clients: [client],
        activities: midPeriodMove,
        memberIds: ['anna'],
      }),
    );

    expect(forTom.kpis.managedClients?.value).toBe(0);
    expect(forAnna.kpis.managedClients?.value).toBe(1);
  });

  it('keeps an event in the portfolio of the PIC who owned the client then', () => {
    const dataset = {
      clients: [buildClient({ picId: 'anna' })],
      activities: midPeriodMove,
      subscriptionEvents: [
        buildEvent({ occurredAt: '2026-10-10T00:00:00.000Z' }),
      ],
    };

    expect(
      computeAnalytics(buildDataset({ ...dataset, memberIds: ['tom'] })).kpis
        .portfolioUpgrades?.value,
    ).toBe(1);
    expect(
      computeAnalytics(buildDataset({ ...dataset, memberIds: ['anna'] })).kpis
        .portfolioUpgrades?.value,
    ).toBe(0);
  });

  it('leaves a past period alone when the client moves after it', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        clients: [
          buildClient({
            picId: 'anna',
            assignedAt: '2026-11-05T00:00:00.000Z',
          }),
        ],
        activities: [
          picChange('p1', '2026-01-01T00:00:00.000Z', null, 'tom'),
          picChange('p2', '2026-11-05T00:00:00.000Z', 'tom', 'anna'),
        ],
        memberIds: ['tom'],
      }),
    );

    expect(kpis.managedClients?.value).toBe(1);
  });

  it('falls back to the current PIC from its assignment when nothing was logged', () => {
    expect(
      buildOwnershipSpans(
        {
          picId: 'tom',
          assignedAt: '2026-10-20T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        [],
      ),
    ).toEqual([
      {
        memberId: 'tom',
        from: Date.parse('2026-10-20T00:00:00.000Z'),
        to: Number.POSITIVE_INFINITY,
      },
    ]);
  });
});

describe('contact and interaction rules', () => {
  it('counts calls as interactions but not as client contact', () => {
    const { kpis } = computeAnalytics(
      buildDataset({ activities: [buildActivity({ activityType: 'CALL' })] }),
    );

    expect(kpis.bcInteractions?.value).toBe(1);
    expect(kpis.clientsContacted?.value).toBe(0);
  });

  it('merges a hand-logged copy of an imported contact in the same minute', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        activities: [
          buildActivity({
            id: 'a1',
            activityType: 'EMAIL',
            externalId: 'email:1',
          }),
          buildActivity({
            id: 'a2',
            activityType: 'EMAIL',
            occurredAt: '2026-10-10T00:00:30.000Z',
          }),
        ],
      }),
    );

    expect(kpis.bcInteractions?.value).toBe(1);
  });
});

describe('recovered clients', () => {
  it('needs a BC-confirmed resolution, not a dismissal', () => {
    const resolved = computeAnalytics(
      buildDataset({
        issues: [
          buildIssue({
            status: 'RESOLVED',
            resolvedAt: '2026-10-20T00:00:00.000Z',
            resolvedByMemberId: 'tom',
          }),
        ],
      }),
    );
    const dismissed = computeAnalytics(
      buildDataset({
        issues: [
          buildIssue({
            status: 'DISMISSED',
            resolvedAt: '2026-10-20T00:00:00.000Z',
            resolvedByMemberId: 'tom',
          }),
        ],
      }),
    );

    expect(resolved.kpis.recoveredClients?.value).toBe(1);
    expect(dismissed.kpis.recoveredClients?.value).toBe(0);
  });
});

describe('MRR conventions (7.1)', () => {
  const finance = (overrides: Partial<Parameters<typeof computeFinance>[0]>) =>
    computeFinance({
      period: OCTOBER,
      appName: null,
      portfolioClients: [buildClient({})],
      merchants: [buildMerchant({ pricingPlan: 'GROWTH' })],
      plans: [plan('FREE', 0), plan('GROWTH', 50), plan('PLUS', 150)],
      subscriptionEvents: [],
      payments: [],
      hasAnyPayment: false,
      ...overrides,
    });

  it('counts a free-to-paid upgrade of a non-paying client as New', () => {
    const result = finance({
      subscriptionEvents: [
        buildEvent({ oldPlan: 'FREE', newPlan: 'GROWTH', mrrDelta: 50 }),
      ],
    });

    expect(result.kpis.newMrr?.value).toBe(50);
    expect(result.kpis.expansionMrr?.value).toBe(0);
  });

  it('counts a downgrade to free on the last paid app as Churn', () => {
    const result = finance({
      merchants: [buildMerchant({ pricingPlan: 'FREE' })],
      subscriptionEvents: [
        buildEvent({
          eventType: 'DOWNGRADE',
          oldPlan: 'GROWTH',
          newPlan: 'FREE',
          mrrDelta: -50,
        }),
      ],
    });

    expect(result.kpis.churnedMrr?.value).toBe(50);
    expect(result.kpis.contractionMrr?.value).toBe(0);
  });

  it('keeps a downgrade to free as Contraction while another app is paid', () => {
    const result = finance({
      merchants: [
        buildMerchant({ pricingPlan: 'FREE' }),
        buildMerchant({
          id: 'merchant-mida',
          pricingPlan: 'PRO',
          app: { id: 'app-mida', name: 'MIDA' },
        }),
      ],
      plans: [plan('FREE', 0), plan('GROWTH', 50), plan('PRO', 30, 'MIDA')],
      subscriptionEvents: [
        buildEvent({
          eventType: 'DOWNGRADE',
          oldPlan: 'GROWTH',
          newPlan: 'FREE',
          mrrDelta: -50,
        }),
      ],
    });

    expect(result.kpis.contractionMrr?.value).toBe(50);
    expect(result.kpis.churnedMrr?.value).toBe(0);
  });

  it('prices total MRR at the plan held at the period end', () => {
    const result = finance({
      merchants: [buildMerchant({ pricingPlan: 'PLUS' })],
      subscriptionEvents: [
        buildEvent({
          oldPlan: 'GROWTH',
          newPlan: 'PLUS',
          occurredAt: '2026-11-10T00:00:00.000Z',
        }),
      ],
    });

    expect(result.kpis.totalMrr?.value).toBe(50);
  });
});

describe('lifetime revenue coverage (F-05, F-06)', () => {
  it('shows no amount for a client without payments and counts an invoice once', () => {
    const result = computeFinance({
      period: OCTOBER,
      appName: null,
      portfolioClients: [buildClient({}), buildClient({ id: 'client-2' })],
      merchants: [buildMerchant({})],
      plans: [],
      subscriptionEvents: [],
      payments: [
        payment({ invoiceId: 'inv-1' }),
        payment({ id: 'p2', invoiceId: 'inv-1', externalId: 'replay' }),
      ],
      hasAnyPayment: true,
    });

    expect(
      result.revenueLines.find((line) => line.client.id === 'client-1')?.amount,
    ).toBe(100);
    expect(
      result.revenueLines.find((line) => line.client.id === 'client-2')?.amount,
    ).toBeNull();
    expect(result.clientsWithPayments).toBe(1);
    expect(result.kpis.averageLifetimeRevenue?.value).toBe(50);
  });
});

describe('tasks completed from the status history', () => {
  it('keeps a completion in its period after the task was reopened', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        tasks: [
          buildTask({
            status: 'IN_PROGRESS',
            completedAt: null,
            history: [
              {
                at: '2026-10-05T00:00:00.000Z',
                actorMemberId: 'tom',
                action: 'CREATED',
                to: 'TODO',
              },
              {
                at: '2026-10-12T00:00:00.000Z',
                actorMemberId: 'tom',
                action: 'STATUS_CHANGED',
                from: 'TODO',
                to: 'COMPLETED',
              },
              {
                at: '2026-11-03T00:00:00.000Z',
                actorMemberId: 'tom',
                action: 'STATUS_CHANGED',
                from: 'COMPLETED',
                to: 'IN_PROGRESS',
              },
            ],
          }),
        ],
      }),
    );

    expect(kpis.tasksCompleted?.value).toBe(1);
    expect(kpis.openTasks?.value).toBe(0);
  });
});

describe('attribution corrections (§9)', () => {
  it('takes a manager-corrected upgrade credit as set', () => {
    const { kpis } = computeAnalytics(
      buildDataset({
        subscriptionEvents: [
          buildEvent({
            isBcInfluenced: true,
            attributedMemberId: 'tom',
            attributionEvidence: {
              corrections: [
                { at: '2026-10-20T00:00:00.000Z', reason: 'Call logged late' },
              ],
            },
          }),
        ],
      }),
    );

    expect(kpis.bcInfluencedUpgrades?.value).toBe(1);
  });
});
