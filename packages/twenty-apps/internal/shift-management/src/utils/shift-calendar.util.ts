import { getTodayIct, MILLISECONDS_PER_DAY } from './shift-time.util';

// Weekday of the *UTC-anchored* calendar date. Week arithmetic runs entirely in
// UTC (no DST) so days never shift under a timezone; this reads that calendar.
const UTC_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'short',
});

const UTC_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'UTC',
});

// e.g. 'August 2026' — labels the month header. Formats a UTC-anchored instant
// so it never drifts under a timezone.
const UTC_MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
});

const DAYS_PER_WEEK = 7;
const MONTHS_PER_YEAR = 12;

const WEEKDAY_TO_MONDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

const parseIsoDateToUtcMillis = (isoDate: string): number => {
  const [year, month, day] = isoDate.split('-').map(Number);

  return Date.UTC(year, month - 1, day);
};

const utcMillisToIsoDate = (utcMillis: number): string =>
  UTC_DATE_FORMATTER.format(new Date(utcMillis));

export type IctWeekRange = {
  fromDate: string;
  toDate: string;
  days: string[];
};

// The Monday-to-Sunday ICT week that contains `reference`, as 'YYYY-MM-DD'
// strings. days[0] = Monday .. days[6] = Sunday. Anchors on the ICT calendar
// date, then walks the week in UTC so the result is DST-safe.
export const getIctWeekRange = (reference: Date): IctWeekRange => {
  const todayIct = getTodayIct(reference);
  const todayUtcMillis = parseIsoDateToUtcMillis(todayIct);
  const weekday = UTC_WEEKDAY_FORMATTER.format(new Date(todayUtcMillis));
  const mondayOffset = WEEKDAY_TO_MONDAY_INDEX[weekday] ?? 0;
  const mondayUtcMillis = todayUtcMillis - mondayOffset * MILLISECONDS_PER_DAY;

  const days = Array.from({ length: DAYS_PER_WEEK }, (_unused, index) =>
    utcMillisToIsoDate(mondayUtcMillis + index * MILLISECONDS_PER_DAY),
  );

  return { fromDate: days[0], toDate: days[6], days };
};

// Shift a 'YYYY-MM-DD' date by whole days on the UTC-anchored calendar
// (DST-safe). Used to route an overnight shift's after-midnight hours onto the
// next calendar day.
export const addDaysToIsoDate = (isoDate: string, delta: number): string =>
  utcMillisToIsoDate(
    parseIsoDateToUtcMillis(isoDate) + delta * MILLISECONDS_PER_DAY,
  );

// Weekday index of a calendar date, Monday-first (Mon=0 .. Sun=6).
export const getWeekdayIndex = (date: string): number => {
  const weekday = UTC_WEEKDAY_FORMATTER.format(
    new Date(parseIsoDateToUtcMillis(date)),
  );

  return WEEKDAY_TO_MONDAY_INDEX[weekday] ?? 0;
};

// The ICT calendar month of an instant, as 'YYYY-MM'.
export const getIctMonthValue = (reference: Date = new Date()): string =>
  getTodayIct(reference).slice(0, 7);

// Shift a 'YYYY-MM' month value by `delta` months (pure integer math on the
// month index, never a Date so it stays timezone-safe).
export const addMonthsToMonthValue = (
  monthValue: string,
  delta: number,
): string => {
  const [year, month] = monthValue.split('-').map(Number);
  const monthIndex = year * MONTHS_PER_YEAR + (month - 1) + delta;
  const newYear = Math.floor(monthIndex / MONTHS_PER_YEAR);
  const newMonth =
    (((monthIndex % MONTHS_PER_YEAR) + MONTHS_PER_YEAR) % MONTHS_PER_YEAR) + 1;

  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
};

// e.g. '2026-08' -> 'August 2026'.
export const getMonthLabel = (monthValue: string): string =>
  UTC_MONTH_LABEL_FORMATTER.format(
    new Date(parseIsoDateToUtcMillis(`${monthValue}-01`)),
  );

export type IctMonthCalendar = {
  // Monday-first weeks; a cell is a 'YYYY-MM-DD' in-month date, or null padding
  // for the days that fall outside the month at the start/end of the grid.
  weeks: (string | null)[][];
  fromDate: string;
  toDate: string;
};

// The calendar grid for `monthValue` ('YYYY-MM'): Monday-first weeks padded
// with nulls so every week has 7 cells. fromDate/toDate bound the month for
// querying. All arithmetic runs in UTC millis, so days never shift.
export const buildIctMonthCalendar = (monthValue: string): IctMonthCalendar => {
  const [year, month] = monthValue.split('-').map(Number);
  const firstDate = `${monthValue}-01`;
  const firstUtcMillis = parseIsoDateToUtcMillis(firstDate);
  // Date.UTC(year, month, 0) is the last day of the 1-based `month`.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = getWeekdayIndex(firstDate);

  const cells: (string | null)[] = Array.from(
    { length: leadingBlanks },
    () => null,
  );

  for (let dayNumber = 0; dayNumber < daysInMonth; dayNumber += 1) {
    cells.push(
      utcMillisToIsoDate(firstUtcMillis + dayNumber * MILLISECONDS_PER_DAY),
    );
  }

  while (cells.length % DAYS_PER_WEEK !== 0) {
    cells.push(null);
  }

  const weeks: (string | null)[][] = [];

  for (let index = 0; index < cells.length; index += DAYS_PER_WEEK) {
    weeks.push(cells.slice(index, index + DAYS_PER_WEEK));
  }

  return {
    weeks,
    fromDate: firstDate,
    toDate: utcMillisToIsoDate(
      firstUtcMillis + (daysInMonth - 1) * MILLISECONDS_PER_DAY,
    ),
  };
};

// First -> last ICT calendar day of a 'YYYY-MM' month. Last-day count comes
// from Date.UTC day-0 of the next month (leap-year correct).
export const getMonthRange = (
  monthValue: string,
): { fromDate: string; toDate: string } => {
  const [year, month] = monthValue.split('-').map(Number);
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthPart = String(month).padStart(2, '0');

  return {
    fromDate: `${year}-${monthPart}-01`,
    toDate: `${year}-${monthPart}-${String(lastDayOfMonth).padStart(2, '0')}`,
  };
};

// The last `count` months as 'YYYY-MM', most recent (current ICT month) first.
export const getRecentMonthValues = (
  count: number,
  reference: Date = new Date(),
): string[] => {
  const [year, month] = getTodayIct(reference).split('-').map(Number);
  const currentMonthIndex = year * MONTHS_PER_YEAR + (month - 1);

  return Array.from({ length: count }, (_unused, offset) => {
    const monthIndex = currentMonthIndex - offset;
    const monthYear = Math.floor(monthIndex / MONTHS_PER_YEAR);
    const monthOfYear = (monthIndex % MONTHS_PER_YEAR) + 1;

    return `${monthYear}-${String(monthOfYear).padStart(2, '0')}`;
  });
};

// Human label for a 'YYYY-MM' value, e.g. 'August 2026'.
export const formatMonthLabel = (monthValue: string): string =>
  getMonthLabel(monthValue);
