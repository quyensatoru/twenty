import {
  type AudienceDateCondition,
  type AudienceDateUnit,
} from '../types/audience-filter';

export type ResolvedAudienceDateCondition =
  | { kind: 'RANGE'; gte: string | null; lt: string | null }
  | { kind: 'EMPTY' }
  | { kind: 'NOT_EMPTY' }
  | { kind: 'NO_MATCH' };

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const subtractUnits = (
  now: Date,
  amount: number,
  unit: AudienceDateUnit,
): Date => {
  if (unit !== 'MONTH') {
    return new Date(
      now.getTime() - amount * (unit === 'WEEK' ? 7 : 1) * DAY_IN_MS,
    );
  }

  // Clamped so "1 month before March 31" is February 28, not March 3.
  const target = new Date(now.getTime());
  const day = target.getUTCDate();

  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() - amount);

  const daysInTargetMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();

  target.setUTCDate(Math.min(day, daysInTargetMonth));

  return target;
};

const startOfUtcDay = (date: string) => new Date(`${date}T00:00:00.000Z`);

const startOfNextUtcDay = (date: string) =>
  new Date(startOfUtcDay(date).getTime() + DAY_IN_MS);

// An incomplete condition matches nobody rather than being skipped: a
// half-filled "installed before" must not widen a send to every merchant.
export const resolveAudienceDateCondition = (
  condition: AudienceDateCondition,
  now: Date,
): ResolvedAudienceDateCondition => {
  const { operator, amount, unit, date, endDate } = condition;

  switch (operator) {
    case 'IS_EMPTY':
      return { kind: 'EMPTY' };
    case 'IS_NOT_EMPTY':
      return { kind: 'NOT_EMPTY' };
    case 'IN_LAST':
    case 'MORE_THAN_AGO': {
      if (amount === null) {
        return { kind: 'NO_MATCH' };
      }

      const boundary = subtractUnits(now, amount, unit).toISOString();

      return operator === 'IN_LAST'
        ? { kind: 'RANGE', gte: boundary, lt: null }
        : { kind: 'RANGE', gte: null, lt: boundary };
    }
    case 'BEFORE':
      return date === null
        ? { kind: 'NO_MATCH' }
        : { kind: 'RANGE', gte: null, lt: startOfUtcDay(date).toISOString() };
    case 'ON_OR_AFTER':
      return date === null
        ? { kind: 'NO_MATCH' }
        : { kind: 'RANGE', gte: startOfUtcDay(date).toISOString(), lt: null };
    case 'BETWEEN': {
      if (date === null || endDate === null) {
        return { kind: 'NO_MATCH' };
      }

      const [first, last] = date <= endDate ? [date, endDate] : [endDate, date];

      return {
        kind: 'RANGE',
        gte: startOfUtcDay(first).toISOString(),
        lt: startOfNextUtcDay(last).toISOString(),
      };
    }
  }
};
