import { describe, expect, it } from 'vitest';

import { buildSubscriptionEventKey } from '../trigger-keys.util';
import {
  isStaleUsageEvent,
  mentionsUpsell,
  pickOpportunityToConvert,
} from '../automation-upsell.util';

describe('mentionsUpsell', () => {
  it('spots plan talk in English and Vietnamese, as whole words', () => {
    expect(mentionsUpsell('Shall we upgrade your plan before the limit?')).toBe(true);
    expect(mentionsUpsell('Anh có muốn nâng cấp gói không ạ?')).toBe(true);
    expect(mentionsUpsell('Thanks, the widget works now')).toBe(false);
    expect(mentionsUpsell('Please explain the planogram export')).toBe(false);
    expect(mentionsUpsell(null)).toBe(false);
  });
});

describe('buildSubscriptionEventKey', () => {
  it('gives the CRM sync and the billing ingest the same key for one change', () => {
    const base = { vipClientId: 'c1', appName: 'bloy', eventType: 'UPGRADE', newPlan: 'growth' };

    expect(buildSubscriptionEventKey({ ...base, effectiveAt: '2026-11-10T03:00:00.000Z' })).toBe(
      buildSubscriptionEventKey({ ...base, appName: 'BLOY', newPlan: 'GROWTH', effectiveAt: '2026-11-10T22:15:00+00:00' }),
    );
    expect(buildSubscriptionEventKey({ ...base, effectiveAt: '2026-11-11T00:00:00.000Z' })).not.toBe(
      buildSubscriptionEventKey({ ...base, effectiveAt: '2026-11-10T00:00:00.000Z' }),
    );
  });
});

describe('pickOpportunityToConvert', () => {
  const opportunity = (id: string, overrides: Record<string, unknown>) => ({
    id,
    appName: 'BLOY',
    status: 'OPEN',
    billingCycle: '2026-10',
    createdAt: '2026-10-05T00:00:00.000Z',
    ...overrides,
  });

  it('takes the newest open cycle of the same app raised before the change', () => {
    const picked = pickOpportunityToConvert(
      [
        opportunity('old', {}),
        opportunity('new', { billingCycle: '2026-11', createdAt: '2026-11-03T00:00:00.000Z' }),
        opportunity('after', { billingCycle: '2026-12', createdAt: '2026-12-01T00:00:00.000Z' }),
        opportunity('other-app', { appName: 'MIDA', billingCycle: '2026-11' }),
        opportunity('lost', { status: 'LOST', billingCycle: '2026-11' }),
      ],
      'bloy',
      '2026-11-10T00:00:00.000Z',
    );

    expect(picked?.id).toBe('new');
  });

  it('returns nothing when no open opportunity predates the change', () => {
    expect(pickOpportunityToConvert([opportunity('late', { createdAt: '2026-11-20T00:00:00.000Z' })], 'BLOY', '2026-11-10T00:00:00.000Z')).toBeNull();
  });
});

describe('isStaleUsageEvent', () => {
  const previous = { at: '2026-11-10T10:00:00.000Z', eventId: 'e-2' };

  it('drops a replayed event and a late older reading', () => {
    expect(isStaleUsageEvent({ previous, at: '2026-11-10T12:00:00.000Z', eventId: 'e-2' })).toBe(true);
    expect(isStaleUsageEvent({ previous, at: '2026-11-09T12:00:00.000Z', eventId: 'e-1' })).toBe(true);
    expect(isStaleUsageEvent({ previous, at: '2026-11-10T12:00:00.000Z', eventId: 'e-3' })).toBe(false);
    expect(isStaleUsageEvent({ previous: undefined, at: '2026-11-01T00:00:00.000Z', eventId: null })).toBe(false);
  });
});
