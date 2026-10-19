import { describe, expect, it } from 'vitest';

import {
  buildCrispPlanData,
  hasCrispPlanData,
  type PlanDataMerchant,
  startsNewPlan,
} from '../plan-data.util';

const merchant = (overrides: Partial<PlanDataMerchant>): PlanDataMerchant => ({
  pricingPlan: 'FREE',
  planStartedAt: '2026-10-05T08:30:00.000Z',
  using: true,
  ...overrides,
});

describe('buildCrispPlanData', () => {
  it('writes each product of a shared website under its own keys', () => {
    expect(
      buildCrispPlanData(
        new Map([
          ['MIDA', merchant({ pricingPlan: 'SS_GROWTH' })],
          [
            'FRAUD',
            merchant({
              pricingPlan: 'FR_ADVANCED',
              planStartedAt: '2026-09-01T00:00:00.000Z',
            }),
          ],
        ]),
      ),
    ).toEqual({
      crm_mida_plan: 'SS_GROWTH',
      crm_mida_plan_started_at: '2026-10-05',
      crm_fraud_plan: 'FR_ADVANCED',
      crm_fraud_plan_started_at: '2026-09-01',
    });
  });

  it('writes the plan with an empty start when the start is unknown', () => {
    expect(
      buildCrispPlanData(
        new Map([['BLOY', merchant({ planStartedAt: null })]]),
      ),
    ).toEqual({ crm_bloy_plan: 'FREE', crm_bloy_plan_started_at: '' });
  });

  it('marks an uninstalled product', () => {
    expect(
      buildCrispPlanData(new Map([['BLOY', merchant({ using: false })]])),
    ).toEqual({ crm_bloy_plan: 'UNINSTALLED', crm_bloy_plan_started_at: '' });
  });

  it('writes nothing for a product without a plan, or no product at all', () => {
    expect(buildCrispPlanData(new Map())).toBeNull();
    expect(
      buildCrispPlanData(new Map([['BLOY', merchant({ pricingPlan: null })]])),
    ).toBeNull();
  });
});

describe('hasCrispPlanData', () => {
  it('ignores the keys the product apps set', () => {
    expect(
      hasCrispPlanData(
        {
          bloy_app_plan: 'Free',
          crm_bloy_plan: 'FREE',
          crm_bloy_plan_started_at: '2026-10-05',
        },
        { crm_bloy_plan: 'FREE', crm_bloy_plan_started_at: '2026-10-05' },
      ),
    ).toBe(true);
    expect(
      hasCrispPlanData(
        { crm_bloy_plan: 'FREE' },
        { crm_bloy_plan: 'FREE', crm_bloy_plan_started_at: '2026-10-05' },
      ),
    ).toBe(false);
    expect(hasCrispPlanData(null, { crm_bloy_plan: 'FREE' })).toBe(false);
  });
});

describe('startsNewPlan', () => {
  it('starts a new plan on any plan change, upgrades and cancellations included', () => {
    expect(
      startsNewPlan({ pricingPlan: 'LAUNCH' }, { pricingPlan: 'GROWTH' }),
    ).toBe(true);
    expect(
      startsNewPlan({ pricingPlan: 'GROWTH' }, { pricingPlan: 'FREE' }),
    ).toBe(true);
  });

  it('starts a new plan on a reinstall', () => {
    expect(
      startsNewPlan(
        { pricingPlan: 'FREE', using: false },
        { pricingPlan: 'FREE', using: true },
      ),
    ).toBe(true);
  });

  it('keeps the plan start the sync sent along with the new plan', () => {
    expect(
      startsNewPlan(
        { pricingPlan: 'FREE', planStartedAt: null },
        { pricingPlan: 'GROWTH', planStartedAt: '2025-03-01T00:00:00.000Z' },
      ),
    ).toBe(false);
  });

  it('keeps the plan on an uninstall or an unrelated update', () => {
    expect(
      startsNewPlan(
        { pricingPlan: 'FREE', using: true },
        { pricingPlan: 'FREE', using: false },
      ),
    ).toBe(false);
    expect(
      startsNewPlan({ pricingPlan: 'FREE' }, { pricingPlan: 'FREE' }),
    ).toBe(false);
  });
});
