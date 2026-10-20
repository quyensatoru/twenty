const ICT_OFFSET_MILLIS = 7 * 60 * 60 * 1000;
const DAY_MILLIS = 24 * 60 * 60 * 1000;

export type CalendarDay = { year: number; month: number; day: number };

const pad = (value: number): string => String(value).padStart(2, '0');

export const formatIsoDate = ({ year, month, day }: CalendarDay): string =>
  `${year}-${pad(month)}-${pad(day)}`;

export const parseIsoDate = (value: string | null | undefined): CalendarDay | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');

  if (match === null) {
    return null;
  }

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { year, month, day };
};

// The team works on Vietnam time: "today" flips at 00:00 ICT for everyone,
// whatever time zone their browser or the server runs in.
export const getTodayIct = (now: Date): string => {
  const shifted = new Date(now.getTime() + ICT_OFFSET_MILLIS);

  return formatIsoDate({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  });
};

const toUtcMillis = ({ year, month, day }: CalendarDay): number =>
  Date.UTC(year, month - 1, day);

export const daysBetween = (fromIso: string, toIso: string): number => {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);

  if (from === null || to === null) {
    return Number.NaN;
  }

  return Math.round((toUtcMillis(to) - toUtcMillis(from)) / DAY_MILLIS);
};

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

// 29 February is celebrated on 28 February in non-leap years.
const clampToMonth = (year: number, month: number, day: number): CalendarDay =>
  month === 2 && day === 29 && !isLeapYear(year)
    ? { year, month, day: 28 }
    : { year, month, day };

export const nextYearlyDate = (
  { month, day }: Pick<CalendarDay, 'month' | 'day'>,
  todayIso: string,
): CalendarDay => {
  const today = parseIsoDate(todayIso);

  if (today === null) {
    throw new Error(`Invalid date ${todayIso}`);
  }

  const thisYear = clampToMonth(today.year, month, day);

  return toUtcMillis(thisYear) >= toUtcMillis(today)
    ? thisYear
    : clampToMonth(today.year + 1, month, day);
};

export const ictDateTimeToMillis = (isoDate: string, time = '00:00'): number => {
  const date = parseIsoDate(isoDate);
  const [hours, minutes] = time.split(':').map(Number);

  if (date === null) {
    return Number.NaN;
  }

  return (
    toUtcMillis(date) +
    ((Number.isFinite(hours) ? hours : 0) * 60 +
      (Number.isFinite(minutes) ? minutes : 0)) *
      60 *
      1000 -
    ICT_OFFSET_MILLIS
  );
};
