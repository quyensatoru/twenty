import { describe, expect, it } from 'vitest';

import {
  type BcIssueRecord,
  type BcReviewRecord,
  type MerchantRecord,
  type VipClientRecord,
} from '../../types/bc-records';
import { type ClientListFilters } from '../../types/dashboard';
import {
  buildClientRow,
  buildPlanOptions,
  countKpis,
  matchesClientFilters,
  readClientSortValue,
} from '../dashboard-rows.util';

const vipClient: VipClientRecord = {
  id: 'client-1',
  name: 'Rip Curl',
  shopDomain: 'ripcurl.myshopify.com',
  relationshipStatus: 'ACTIVE',
  statusChangedAt: null,
  lastBcContactAt: null,
  lastBcContactMemberId: null,
  awaitingReplySince: null,
  assignedAt: null,
  notes: null,
  appUsage: null,
  picId: 'bc-1',
  picAssignedById: null,
  teamId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const merchant = (appName: string, pricingPlan: string, using = true): MerchantRecord => ({
  id: `merchant-${appName}`,
  name: 'ripcurl.myshopify.com',
  storeName: null,
  pricingPlan,
  using,
  installedAt: null,
  uninstalledAt: null,
  planStartedAt: null,
  vipClientId: 'client-1',
  app: { id: appName, name: appName },
});

const review = (appName: string): BcReviewRecord => ({
  id: `review-${appName}`,
  name: null,
  appName,
  rating: 5,
  body: null,
  publishedAt: null,
  reviewUrl: null,
  isVerified: true,
  creditedMemberId: null,
  evidenceActivityId: null,
  externalId: null,
  source: 'MANUAL',
  vipClientId: 'client-1',
});

const noFilters: ClientListFilters = {
  search: '',
  appName: null,
  plan: null,
  picId: null,
  status: null,
  appHealth: null,
  review: null,
  kpi: 'ALL',
};

const row = buildClientRow({
  vipClient,
  merchants: [merchant('BLOY', 'GROWTH'), merchant('MIDA', 'PLUS')],
  openIssues: [{ appNames: ['BLOY'] } as BcIssueRecord],
  reviews: [review('MIDA')],
  memberNames: new Map([['bc-1', 'Tom']]),
  planCatalog: new Map(),
  paidMerchantIds: new Set(),
  conversationsByMerchant: new Map([
    [
      'merchant-MIDA',
      {
        id: 'chat-1',
        merchantId: 'merchant-MIDA',
        lastMessageAt: '2026-11-01T00:00:00.000Z',
        lastMessageExcerpt: 'Heatmap is empty',
        websiteId: 'web-1',
        sessionId: 'session_1',
      },
    ],
  ]),
});

describe('buildClientRow', () => {
  it('keeps one row with each app aligned to its own plan, health and review', () => {
    expect(row.apps.map((app) => [app.appName, app.plan, app.health, app.review])).toEqual([
      ['BLOY', 'GROWTH', 'AT_RISK', 'NEEDS_REVIEW'],
      ['MIDA', 'PLUS', 'HEALTHY', 'REVIEWED'],
    ]);
    expect(row.reviewedCount).toBe(1);
    expect(row.picName).toBe('Tom');
  });

  it('links each app to its own Crisp chat', () => {
    expect(row.apps.map((app) => app.chat?.crispUrl ?? null)).toEqual([
      null,
      'https://app.crisp.chat/website/web-1/inbox/session_1/',
    ]);
    expect(row.crispConversationId).toBe('chat-1');
  });

  it('shows Cancelled for a free plan after a paid one, without review eligibility', () => {
    const cancelledRow = buildClientRow({
      vipClient,
      merchants: [merchant('BLOY', 'FREE')],
      openIssues: [],
      reviews: [],
      memberNames: new Map(),
      planCatalog: new Map([
        [
          'BLOY:FREE',
          { appName: 'BLOY', planCode: 'FREE', label: 'Free', rank: 0, isTrial: false, monthlyPrice: 0 },
        ],
      ]),
      paidMerchantIds: new Set(['merchant-BLOY']),
      conversationsByMerchant: new Map(),
    });

    expect(cancelledRow.apps[0].lifecycle).toBe('CANCELLED');
    expect(cancelledRow.apps[0].review).toBe('NOT_ELIGIBLE');
  });
});

describe('readClientSortValue', () => {
  it('sorts reviews on the selected product only', () => {
    expect(readClientSortValue(row, 'review', 'MIDA')).toBe(2);
    expect(readClientSortValue(row, 'review', 'BLOY')).toBe(1);
    expect(readClientSortValue(row, 'review', null)).toBe(0.5);
  });
});

describe('buildPlanOptions', () => {
  it('keeps plans of different apps apart', () => {
    const options = buildPlanOptions({ rows: [row], planCatalog: new Map(), appName: null });

    expect(options).toEqual([
      { value: 'BLOY:GROWTH', label: 'BLOY · GROWTH' },
      { value: 'MIDA:PLUS', label: 'MIDA · PLUS' },
    ]);
    expect(matchesClientFilters(row, { ...noFilters, plan: 'BLOY:PLUS' })).toBe(false);
    expect(matchesClientFilters(row, { ...noFilters, plan: 'MIDA:PLUS' })).toBe(true);
  });
});

describe('matchesClientFilters', () => {
  it('matches product, plan and review on the same app only', () => {
    expect(
      matchesClientFilters(row, { ...noFilters, appName: 'MIDA', review: 'NEEDS_REVIEW' }),
    ).toBe(false);
    expect(
      matchesClientFilters(row, { ...noFilters, appName: 'BLOY', review: 'NEEDS_REVIEW' }),
    ).toBe(true);
    expect(
      matchesClientFilters(row, { ...noFilters, plan: 'PLUS', review: 'NEEDS_REVIEW' }),
    ).toBe(false);
    expect(matchesClientFilters(row, { ...noFilters, review: 'NEEDS_REVIEW' })).toBe(true);
  });

  it('searches name and domain and filters unassigned clients', () => {
    expect(matchesClientFilters(row, { ...noFilters, search: 'RIPCURL.my' })).toBe(true);
    expect(matchesClientFilters(row, { ...noFilters, picId: 'UNASSIGNED' })).toBe(false);
  });

  it('counts waiting and follow-up clients together as needing follow-up', () => {
    expect(
      countKpis([{ status: 'FOLLOW_UP' }, { status: 'WAITING_FOR_CLIENT' }, { status: 'AT_RISK' }]),
    ).toEqual({ total: 3, active: 0, needFollowUp: 2, atRisk: 1 });
  });
});
