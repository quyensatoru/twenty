import { describe, expect, it } from 'vitest';

import { EMPTY_AUDIENCE_FILTER } from '../../constants/empty-audience-filter';
import { type AudienceDateCondition } from '../../types/audience-filter';
import { buildMerchantGraphqlFilter } from '../build-merchant-graphql-filter.util';
import { matchesAudienceFilter } from '../matches-audience-filter.util';
import { parseAudienceFilter } from '../parse-audience-filter.util';
import { resolveAudienceDateCondition } from '../resolve-audience-date-condition.util';

const NOW = new Date('2026-10-12T10:00:00.000Z');

const condition = (
  partial: Partial<AudienceDateCondition>,
): AudienceDateCondition => ({
  field: 'installedAt',
  operator: 'IN_LAST',
  amount: null,
  unit: 'DAY',
  date: null,
  endDate: null,
  ...partial,
});

describe('resolveAudienceDateCondition', () => {
  it('turns relative operators into a window ending now', () => {
    expect(
      resolveAudienceDateCondition(
        condition({ operator: 'IN_LAST', amount: 7, unit: 'DAY' }),
        NOW,
      ),
    ).toEqual({ kind: 'RANGE', gte: '2026-10-05T10:00:00.000Z', lt: null });
    expect(
      resolveAudienceDateCondition(
        condition({ operator: 'MORE_THAN_AGO', amount: 2, unit: 'WEEK' }),
        NOW,
      ),
    ).toEqual({ kind: 'RANGE', gte: null, lt: '2026-09-28T10:00:00.000Z' });
  });

  it('clamps month arithmetic to the end of the shorter month', () => {
    expect(
      resolveAudienceDateCondition(
        condition({ operator: 'IN_LAST', amount: 1, unit: 'MONTH' }),
        new Date('2026-03-31T08:00:00.000Z'),
      ),
    ).toEqual({ kind: 'RANGE', gte: '2026-02-28T08:00:00.000Z', lt: null });
  });

  it('treats calendar dates as whole UTC days', () => {
    expect(
      resolveAudienceDateCondition(
        condition({ operator: 'BEFORE', date: '2026-10-01' }),
        NOW,
      ),
    ).toEqual({ kind: 'RANGE', gte: null, lt: '2026-10-01T00:00:00.000Z' });
    expect(
      resolveAudienceDateCondition(
        condition({ operator: 'ON_OR_AFTER', date: '2026-10-01' }),
        NOW,
      ),
    ).toEqual({ kind: 'RANGE', gte: '2026-10-01T00:00:00.000Z', lt: null });
    expect(
      resolveAudienceDateCondition(
        condition({
          operator: 'BETWEEN',
          date: '2026-09-30',
          endDate: '2026-09-01',
        }),
        NOW,
      ),
    ).toEqual({
      kind: 'RANGE',
      gte: '2026-09-01T00:00:00.000Z',
      lt: '2026-10-01T00:00:00.000Z',
    });
  });

  it('matches nobody while a condition is incomplete', () => {
    expect(
      resolveAudienceDateCondition(condition({ operator: 'IN_LAST' }), NOW),
    ).toEqual({ kind: 'NO_MATCH' });
    expect(
      resolveAudienceDateCondition(
        condition({ operator: 'BETWEEN', date: '2026-09-01' }),
        NOW,
      ),
    ).toEqual({ kind: 'NO_MATCH' });
  });
});

describe('parseAudienceFilter date conditions', () => {
  it('defaults to no condition for filters saved before they existed', () => {
    expect(parseAudienceFilter({ appIds: ['a'] }).dateConditions).toEqual([]);
  });

  it('keeps the condition but drops values it cannot read', () => {
    expect(
      parseAudienceFilter({
        dateConditions: [
          {
            field: 'installedAt',
            operator: 'IN_LAST',
            amount: -3,
            unit: 'YEAR',
            date: '2026-13-45',
          },
          { field: 'nope', operator: 'IN_LAST' },
          { field: 'createdAt', operator: 'NOPE' },
        ],
      }).dateConditions,
    ).toEqual([condition({ operator: 'IN_LAST' })]);
  });
});

describe('date conditions in the audience filter', () => {
  const filter = {
    ...EMPTY_AUDIENCE_FILTER,
    dateConditions: [
      condition({ operator: 'IN_LAST', amount: 7, unit: 'DAY' }),
      condition({ field: 'uninstalledAt', operator: 'IS_EMPTY' }),
    ],
  };

  it('adds one GraphQL condition per bound', () => {
    expect(buildMerchantGraphqlFilter(filter, NOW).and).toEqual(
      expect.arrayContaining([
        { installedAt: { gte: '2026-10-05T10:00:00.000Z' } },
        { uninstalledAt: { is: 'NULL' } },
      ]),
    );
  });

  it('excludes everyone through GraphQL for an incomplete condition', () => {
    expect(
      buildMerchantGraphqlFilter(
        { ...EMPTY_AUDIENCE_FILTER, dateConditions: [condition({})] },
        NOW,
      ).and,
    ).toContainEqual({ id: { is: 'NULL' } });
  });

  it('agrees in memory, a missing date failing every bound', () => {
    expect(
      matchesAudienceFilter(
        { id: 'm', installedAt: '2026-10-10T00:00:00.000Z' },
        filter,
        NOW,
      ),
    ).toBe(true);
    expect(
      matchesAudienceFilter(
        { id: 'm', installedAt: '2026-10-01T00:00:00.000Z' },
        filter,
        NOW,
      ),
    ).toBe(false);
    expect(matchesAudienceFilter({ id: 'm' }, filter, NOW)).toBe(false);
    expect(
      matchesAudienceFilter(
        {
          id: 'm',
          installedAt: '2026-10-10T00:00:00.000Z',
          uninstalledAt: '2026-10-11T00:00:00.000Z',
        },
        filter,
        NOW,
      ),
    ).toBe(false);
  });

  it('keeps the upper bound exclusive', () => {
    const before = {
      ...EMPTY_AUDIENCE_FILTER,
      dateConditions: [condition({ operator: 'BEFORE', date: '2026-10-01' })],
    };

    expect(
      matchesAudienceFilter(
        { id: 'm', installedAt: '2026-09-30T23:59:59.999Z' },
        before,
        NOW,
      ),
    ).toBe(true);
    expect(
      matchesAudienceFilter(
        { id: 'm', installedAt: '2026-10-01T00:00:00.000Z' },
        before,
        NOW,
      ),
    ).toBe(false);
  });
});
