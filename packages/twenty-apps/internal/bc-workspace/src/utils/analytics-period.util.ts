import {
  type AnalyticsPeriodInput,
  type AnalyticsPeriodPreset,
  type ReportingPeriod,
} from '../types/analytics';

const DAY_MS = 86_400_000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_CUSTOM_DAYS = 3 * 366;

export const ANALYTICS_PERIOD_PRESETS: AnalyticsPeriodPreset[] = [
  '7',
  '30',
  '90',
  '180',
  '365',
];

const readParts = (instant: number, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const read = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour') % 24,
    minute: read('minute'),
    second: read('second'),
  };
};

// Offset of the timezone at an instant, in ms (positive east of UTC).
const readOffset = (instant: number, timezone: string): number => {
  const parts = readParts(instant, timezone);
  const wallAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return wallAsUtc - Math.floor(instant / 1000) * 1000;
};

export const isValidTimezone = (timezone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });

    return true;
  } catch {
    return false;
  }
};

export const parseLocalDate = (value: string): Date | null => {
  const match = DATE_PATTERN.exec(value);

  if (match === null) {
    return null;
  }

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );

  return date.toISOString().slice(0, 10) === value ? date : null;
};

const addDays = (localDate: string, days: number): string => {
  const date = parseLocalDate(localDate);

  if (date === null) {
    throw new Error('Invalid date.');
  }

  return new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10);
};

// UTC instant of local midnight; offsets are re-read at the result so a DST
// change on that day lands on the right hour.
export const localMidnightToUtc = (
  localDate: string,
  timezone: string,
): string => {
  const date = parseLocalDate(localDate);

  if (date === null) {
    throw new Error('Invalid date.');
  }

  const guess = date.getTime();
  let instant = guess - readOffset(guess, timezone);

  instant = guess - readOffset(instant, timezone);

  return new Date(instant).toISOString();
};

export const readLocalDate = (
  instant: string | number,
  timezone: string,
): string => {
  const parts = readParts(
    typeof instant === 'number' ? instant : Date.parse(instant),
    timezone,
  );

  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};

export const resolveReportingPeriod = ({
  input,
  timezone,
  now,
}: {
  input: AnalyticsPeriodInput;
  timezone: string;
  now: string;
}): ReportingPeriod => {
  const safeTimezone = isValidTimezone(timezone) ? timezone : 'UTC';
  const today = readLocalDate(now, safeTimezone);
  let fromDate: string;
  let toDate: string;

  if ('preset' in input) {
    const days = Number(input.preset);

    if (!ANALYTICS_PERIOD_PRESETS.includes(input.preset)) {
      throw new Error('Unknown reporting period.');
    }

    toDate = today;
    fromDate = addDays(today, -(days - 1));
  } else {
    if (
      parseLocalDate(input.from) === null ||
      parseLocalDate(input.to) === null
    ) {
      throw new Error('Pick a valid From and To date.');
    }

    if (input.from > input.to) {
      throw new Error('The From date must be on or before the To date.');
    }

    fromDate = input.from;
    toDate = input.to;
  }

  const dayCount =
    Math.round(
      ((parseLocalDate(toDate)?.getTime() ?? 0) -
        (parseLocalDate(fromDate)?.getTime() ?? 0)) /
        DAY_MS,
    ) + 1;

  if (dayCount > MAX_CUSTOM_DAYS) {
    throw new Error('Pick a period of at most three years.');
  }

  return {
    start: localMidnightToUtc(fromDate, safeTimezone),
    end: localMidnightToUtc(addDays(toDate, 1), safeTimezone),
    fromDate,
    toDate,
    timezone: safeTimezone,
    dayCount,
  };
};

export const isInPeriod = (
  value: string | null | undefined,
  period: Pick<ReportingPeriod, 'start' | 'end'>,
): boolean => {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  const time = Date.parse(value);

  return time >= Date.parse(period.start) && time < Date.parse(period.end);
};

export const isBeforeEnd = (
  value: string | null | undefined,
  period: Pick<ReportingPeriod, 'end'>,
): boolean =>
  typeof value === 'string' &&
  value.length > 0 &&
  Date.parse(value) < Date.parse(period.end);

// Weekly buckets up to 90 days, monthly beyond, each starting on a local day.
export const buildTrendBuckets = (
  period: ReportingPeriod,
): { label: string; start: string; end: string }[] => {
  const buckets: { label: string; start: string; end: string }[] = [];

  if (period.dayCount <= 90) {
    for (let offset = 0; offset < period.dayCount; offset += 7) {
      const fromDate = addDays(period.fromDate, offset);
      const nextDate = addDays(
        period.fromDate,
        Math.min(offset + 7, period.dayCount),
      );

      buckets.push({
        label: fromDate,
        start: localMidnightToUtc(fromDate, period.timezone),
        end: localMidnightToUtc(nextDate, period.timezone),
      });
    }

    return buckets;
  }

  let cursor = period.fromDate;
  const lastExclusive = addDays(period.toDate, 1);

  while (cursor < lastExclusive) {
    const [year, month] = cursor.split('-').map(Number);
    const nextMonth = new Date(Date.UTC(year, month, 1))
      .toISOString()
      .slice(0, 10);
    const next = nextMonth < lastExclusive ? nextMonth : lastExclusive;

    buckets.push({
      label: cursor.slice(0, 7),
      start: localMidnightToUtc(cursor, period.timezone),
      end: localMidnightToUtc(next, period.timezone),
    });
    cursor = next;
  }

  return buckets;
};
