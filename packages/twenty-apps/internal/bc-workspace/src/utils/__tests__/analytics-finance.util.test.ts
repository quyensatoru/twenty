import { describe, expect, it } from 'vitest';

import {
  type BcPaymentRecord,
  type BcPlanRecord,
} from '../../types/bc-records';
import { computeFinance } from '../analytics-finance.util';
import {
  buildClient,
  buildEvent,
  buildMerchant,
  OCTOBER,
} from './analytics-fixtures';

const plan = (
  appName: string,
  planCode: string,
  monthlyPrice: number | null,
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

const twoAppMerchants = [
  buildMerchant({}),
  buildMerchant({
    id: 'merchant-mida',
    pricingPlan: 'PRO',
    app: { id: 'app-mida', name: 'MIDA' },
  }),
];

describe('computeFinance', () => {
  it('counts a multi-app client once in lifetime revenue, net of refunds (UAT-28)', () => {
    const result = computeFinance({
      period: OCTOBER,
      appName: null,
      portfolioClients: [buildClient({}), buildClient({ id: 'client-2' })],
      merchants: twoAppMerchants,
      plans: [plan('BLOY', 'GROWTH', 50), plan('MIDA', 'PRO', 30)],
      subscriptionEvents: [],
      payments: [
        payment({}),
        payment({ id: 'p2', appName: 'MIDA', amount: 60 }),
        payment({ id: 'p3', kind: 'REFUND', amount: 20 }),
        payment({ id: 'p4', paidAt: '2026-11-05T00:00:00.000Z' }),
      ],
      hasAnyPayment: true,
    });

    expect(result.revenueLines).toHaveLength(2);
    expect(result.revenueLines[0].amount).toBe(140);
    expect(result.kpis.portfolioLifetimeRevenue?.value).toBe(140);
    expect(result.kpis.averageLifetimeRevenue?.value).toBe(70);
    expect(result.kpis.totalMrr?.value).toBe(80);
  });

  it('keeps all-app lifetime revenue under a product filter', () => {
    const result = computeFinance({
      period: OCTOBER,
      appName: 'BLOY',
      portfolioClients: [buildClient({})],
      merchants: twoAppMerchants,
      plans: [plan('BLOY', 'GROWTH', 50), plan('MIDA', 'PRO', 30)],
      subscriptionEvents: [],
      payments: [
        payment({}),
        payment({ id: 'p2', appName: 'MIDA', amount: 60 }),
      ],
      hasAnyPayment: true,
    });

    expect(result.kpis.portfolioLifetimeRevenue?.value).toBe(160);
    expect(result.kpis.totalMrr?.value).toBe(50);
  });

  it('marks finance unavailable instead of zero without feeds (UAT-30)', () => {
    const result = computeFinance({
      period: OCTOBER,
      appName: null,
      portfolioClients: [buildClient({})],
      merchants: twoAppMerchants,
      plans: [plan('BLOY', 'GROWTH', null)],
      subscriptionEvents: [],
      payments: [],
      hasAnyPayment: false,
    });

    expect(result.kpis.totalMrr).toEqual({
      value: null,
      status: 'UNAVAILABLE',
    });
    expect(result.kpis.portfolioLifetimeRevenue).toEqual({
      value: null,
      status: 'UNAVAILABLE',
    });
    expect(result.kpis.averageLifetimeRevenue?.status).toBe('UNAVAILABLE');
  });

  it('classifies MRR movements per client', () => {
    const result = computeFinance({
      period: OCTOBER,
      appName: null,
      portfolioClients: [buildClient({}), buildClient({ id: 'client-2' })],
      merchants: [
        ...twoAppMerchants,
        buildMerchant({
          id: 'm3',
          vipClientId: 'client-2',
          using: false,
          uninstalledAt: '2026-10-20T00:00:00.000Z',
        }),
      ],
      plans: [plan('BLOY', 'GROWTH', 50), plan('MIDA', 'PRO', 30)],
      subscriptionEvents: [
        buildEvent({ id: 'up', mrrDelta: 40 }),
        buildEvent({
          id: 'install-mida',
          eventType: 'INSTALL',
          appName: 'MIDA',
          merchantId: 'merchant-mida',
          mrrDelta: 30,
        }),
        buildEvent({ id: 'down', eventType: 'DOWNGRADE', mrrDelta: -10 }),
        buildEvent({
          id: 'churn',
          eventType: 'UNINSTALL',
          vipClientId: 'client-2',
          merchantId: 'm3',
          mrrDelta: -50,
        }),
      ],
      payments: [],
      hasAnyPayment: false,
    });

    expect(result.kpis.expansionMrr?.value).toBe(70);
    expect(result.kpis.newMrr?.value).toBe(0);
    expect(result.kpis.contractionMrr?.value).toBe(10);
    expect(result.kpis.churnedMrr?.value).toBe(50);
  });
});
