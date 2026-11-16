import { describe, expect, it } from 'vitest';

import { buildOpportunityKey, buildUsageTaskKey } from '../trigger-keys.util';
import {
  type AttributionActivity,
  decideReviewAttribution,
  decideUpgradeAttribution,
} from '../automation-attribution.util';
import {
  decideClassificationAction,
  parseMessageClassification,
} from '../automation-classification.util';
import { matchBcOperator } from '../automation-operator.util';
import { classifyPlanChange, computeMrrDelta } from '../automation-plan.util';
import { readDirectReviewUrl } from '../automation-review.util';
import { decideUsageThreshold } from '../automation-usage.util';

const plans = [
  { appName: 'BLOY', planCode: 'LAUNCH', monthlyPrice: 29, rank: 1 },
  { appName: 'BLOY', planCode: 'GROWTH', monthlyPrice: 99, rank: 2 },
  { appName: 'MIDA', planCode: 'PLUS', monthlyPrice: 49, rank: null },
  { appName: 'MIDA', planCode: 'ENTERPRISE', monthlyPrice: 199, rank: null },
];

const contact = (overrides: Partial<AttributionActivity>): AttributionActivity => ({
  id: 'activity',
  title: 'Crisp message from Tom',
  summary: 'Hi, how is everything going?',
  activityType: 'CRISP_MESSAGE',
  direction: 'OUTBOUND',
  topic: 'GENERAL',
  meetingStatus: null,
  isBcAuthored: true,
  actorMemberId: 'bc-tom',
  occurredAt: '2026-11-01T00:00:00.000Z',
  appName: 'BLOY',
  ...overrides,
});

describe('usage threshold (UAT-11, UAT-12)', () => {
  it('does nothing at 79%, opens at 80%, escalates at 100%', () => {
    expect(decideUsageThreshold(395, 500)).toBe('NONE');
    expect(decideUsageThreshold(400, 500)).toBe('UPSELL');
    expect(decideUsageThreshold(500, 500)).toBe('ESCALATE');
    expect(decideUsageThreshold(10, 0)).toBe('NONE');
  });

  it('keys the 80% and 100% events of one cycle to one task, a new cycle to another', () => {
    const october = buildOpportunityKey({ vipClientId: 'c1', appName: 'bloy', plan: 'growth', billingCycle: '2026-10' });
    const sameCycle = buildOpportunityKey({ vipClientId: 'c1', appName: 'BLOY', plan: 'GROWTH', billingCycle: '2026-10' });
    const november = buildOpportunityKey({ vipClientId: 'c1', appName: 'BLOY', plan: 'GROWTH', billingCycle: '2026-11' });

    expect(buildUsageTaskKey(october)).toBe(buildUsageTaskKey(sameCycle));
    expect(buildUsageTaskKey(october)).not.toBe(buildUsageTaskKey(november));
  });
});

describe('plan changes', () => {
  it('orders by rank, then by price, and leaves unknown changes unclassified', () => {
    expect(classifyPlanChange({ plans, appName: 'BLOY', oldPlan: 'LAUNCH', newPlan: 'GROWTH' })).toBe('UPGRADE');
    expect(classifyPlanChange({ plans, appName: 'MIDA', oldPlan: 'ENTERPRISE', newPlan: 'PLUS' })).toBe('DOWNGRADE');
    expect(classifyPlanChange({ plans, appName: 'MIDA', oldPlan: 'PLUS', newPlan: 'UNKNOWN' })).toBeNull();
  });

  it('prices MRR only when both plans are priced', () => {
    expect(computeMrrDelta({ plans, appName: 'BLOY', oldPlan: 'LAUNCH', newPlan: 'GROWTH' })).toBe(70);
    expect(computeMrrDelta({ plans, appName: 'BLOY', oldPlan: 'GROWTH', newPlan: null })).toBe(-99);
    expect(computeMrrDelta({ plans, appName: 'BLOY', oldPlan: 'GROWTH', newPlan: 'MYSTERY' })).toBeNull();
  });
});

describe('upgrade attribution', () => {
  const changedAt = '2026-11-10T00:00:00.000Z';

  it('gives no credit when the client upgraded before any BC outreach (UAT-14)', () => {
    const decision = decideUpgradeAttribution({
      activities: [contact({ topic: 'UPSELL', occurredAt: '2026-11-12T00:00:00.000Z' })],
      openOpportunityCreatedAts: [],
      appName: 'BLOY',
      changedAt,
      windowDays: 90,
    });

    expect(decision.isBcInfluenced).toBe(false);
  });

  it('gives no credit for an auto task without outreach (UAT-13)', () => {
    const decision = decideUpgradeAttribution({
      activities: [],
      openOpportunityCreatedAts: ['2026-11-01T00:00:00.000Z'],
      appName: 'BLOY',
      changedAt,
      windowDays: 90,
    });

    expect(decision.isBcInfluenced).toBe(false);
  });

  it('credits the BC who reached out before the upgrade (UAT-15)', () => {
    const decision = decideUpgradeAttribution({
      activities: [
        contact({ id: 'a1', topic: 'UPSELL', actorMemberId: 'bc-anna' }),
        contact({ id: 'a2', activityType: 'MEETING', meetingStatus: 'SCHEDULED', topic: 'UPSELL' }),
        contact({ id: 'a3', isBcAuthored: false, topic: 'UPSELL' }),
      ],
      openOpportunityCreatedAts: [],
      appName: 'BLOY',
      changedAt,
      windowDays: 90,
    });

    expect(decision).toMatchObject({ isBcInfluenced: true, attributedMemberId: 'bc-anna', activityIds: ['a1'] });
  });

  it('ignores small talk even after an opportunity existed', () => {
    expect(
      decideUpgradeAttribution({
        activities: [contact({ id: 'a1', occurredAt: '2026-11-05T00:00:00.000Z' })],
        openOpportunityCreatedAts: ['2026-11-01T00:00:00.000Z'],
        appName: 'BLOY',
        changedAt,
        windowDays: 90,
      }).isBcInfluenced,
    ).toBe(false);
  });

  it('counts a plan conversation only after an opportunity existed', () => {
    const base = {
      activities: [
        contact({
          id: 'a1',
          occurredAt: '2026-11-05T00:00:00.000Z',
          summary: 'You are close to your order limit, shall we look at the Growth plan?',
        }),
      ],
      appName: 'BLOY',
      changedAt,
      windowDays: 90,
    };

    expect(decideUpgradeAttribution({ ...base, openOpportunityCreatedAts: ['2026-11-01T00:00:00.000Z'] }).isBcInfluenced).toBe(true);
    expect(decideUpgradeAttribution({ ...base, openOpportunityCreatedAts: ['2026-11-07T00:00:00.000Z'] }).isBcInfluenced).toBe(false);
  });
});

describe('review attribution and links', () => {
  it('credits a review request before publication only', () => {
    const activities = [contact({ id: 'r1', activityType: 'REVIEW_REQUEST', appName: 'MIDA' })];

    expect(decideReviewAttribution({ activities, appName: 'MIDA', publishedAt: '2026-11-03T00:00:00.000Z', windowDays: 60 }).isBcInfluenced).toBe(true);
    expect(decideReviewAttribution({ activities, appName: 'MIDA', publishedAt: '2026-10-30T00:00:00.000Z', windowDays: 60 }).isBcInfluenced).toBe(false);
    expect(decideReviewAttribution({ activities, appName: 'BLOY', publishedAt: '2026-11-03T00:00:00.000Z', windowDays: 60 }).isBcInfluenced).toBe(false);
  });

  it('keeps only direct review links (UAT-21, UAT-22)', () => {
    expect(readDirectReviewUrl('https://apps.shopify.com/bloy/reviews/1234567')).toBe('https://apps.shopify.com/bloy/reviews/1234567');
    expect(readDirectReviewUrl('https://apps.shopify.com/bloy')).toBeNull();
    expect(readDirectReviewUrl('https://apps.shopify.com/bloy/reviews')).toBeNull();
    expect(readDirectReviewUrl(null)).toBeNull();
  });
});

describe('crisp operator matching', () => {
  it('matches aliases without case, spacing or accents and ignores inactive BCs', () => {
    const candidates = [
      { memberId: 'tom', name: 'Tom Hoang', crispOperatorNames: ['Tom BSS'], isActive: true },
      { memberId: 'old', name: 'Lan', crispOperatorNames: null, isActive: false },
    ];

    expect(matchBcOperator('  tom   bss ', candidates)).toBe('tom');
    expect(matchBcOperator('Tôm Hoàng', candidates)).toBe('tom');
    expect(matchBcOperator('Lan', candidates)).toBeNull();
    expect(matchBcOperator('Support Bot', candidates)).toBeNull();
  });
});

describe('message classification (UAT-04, UAT-05, UAT-09)', () => {
  it('ignores a how-to question even when flagged as an issue', () => {
    const result = parseMessageClassification('{"isIssue": true, "isHowTo": true, "confidence": 0.9, "title": "How to set up"}', []);

    expect(decideClassificationAction(result)).toBe('IGNORE');
  });

  it('appends to a known open issue and ignores invented ids', () => {
    const known = parseMessageClassification('```json\n{"isIssue": true, "matchesIssueId": "issue-1", "confidence": 0.8}\n```', ['issue-1']);
    const invented = parseMessageClassification('{"isIssue": false, "matchesIssueId": "nope", "confidence": 0.8}', ['issue-1']);

    expect(decideClassificationAction(known)).toBe('APPEND');
    expect(decideClassificationAction(invented)).toBe('IGNORE');
  });

  it('opens a confident distinct issue and treats garbage as no decision', () => {
    const result = parseMessageClassification('{"isIssue": true, "confidence": 0.7, "title": "Points missing", "appNames": ["BLOY"]}', []);

    expect(decideClassificationAction(result)).toBe('OPEN');
    expect(result?.appNames).toEqual(['BLOY']);
    expect(decideClassificationAction(parseMessageClassification('sorry, I cannot', []))).toBe('IGNORE');
  });
});
