import { type ThemeColor } from 'twenty-ui/theme';
import { isDefined } from 'twenty-shared/utils';

const ICT_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const MILLISECONDS_PER_DAY = 86_400_000;
const MINUTES_PER_DAY = 1440;
const HH_MM_PATTERN = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

// 'en-CA' yields 'YYYY-MM-DD' directly; never build ICT dates with new Date(y, m, d).
const ICT_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: ICT_TIME_ZONE,
});

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

// The wall-clock ICT time of an instant, as HH:mm parts (hourCycle h23).
const ICT_TIME_OF_DAY_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: ICT_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const WEEKDAY_TO_MONDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

// The ICT calendar date of an instant, as 'YYYY-MM-DD'.
export const getIctToday = (reference: Date = new Date()): string =>
  ICT_DATE_FORMATTER.format(reference);

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

// The Monday→Sunday ICT week that contains `reference`, as 'YYYY-MM-DD' strings.
// days[0] = Monday .. days[6] = Sunday. Anchors on the ICT calendar date, then
// walks the week in UTC so the result is DST-safe and timezone-stable.
export const getIctWeekRange = (reference: Date): IctWeekRange => {
  const todayIct = getIctToday(reference);
  const todayUtcMillis = parseIsoDateToUtcMillis(todayIct);
  const weekday = UTC_WEEKDAY_FORMATTER.format(new Date(todayUtcMillis));
  const mondayOffset = WEEKDAY_TO_MONDAY_INDEX[weekday] ?? 0;
  const mondayUtcMillis = todayUtcMillis - mondayOffset * MILLISECONDS_PER_DAY;

  const days = Array.from({ length: 7 }, (_unused, index) =>
    utcMillisToIsoDate(mondayUtcMillis + index * MILLISECONDS_PER_DAY),
  );

  return { fromDate: days[0], toDate: days[6], days };
};

// Shift a 'YYYY-MM-DD' date by whole days on the UTC-anchored calendar (DST-safe,
// never new Date(y, m, d)). Used to route an overnight shift's after-midnight
// hours onto the next calendar day.
export const addDaysToIsoDate = (isoDate: string, delta: number): string =>
  utcMillisToIsoDate(
    parseIsoDateToUtcMillis(isoDate) + delta * MILLISECONDS_PER_DAY,
  );

// Weekday index of a calendar date, Monday-first (Mon=0 .. Sun=6). Reads the
// UTC-anchored weekday so it is timezone-stable and never uses new Date(y, m, d).
export const getWeekdayIndex = (date: string): number => {
  const weekday = UTC_WEEKDAY_FORMATTER.format(
    new Date(parseIsoDateToUtcMillis(date)),
  );

  return WEEKDAY_TO_MONDAY_INDEX[weekday] ?? 0;
};

// The ICT calendar month of an instant, as 'YYYY-MM'.
export const getIctMonthValue = (reference: Date = new Date()): string =>
  getIctToday(reference).slice(0, 7);

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

// e.g. '2026-08' → 'August 2026'.
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

// The calendar grid for `monthValue` ('YYYY-MM'): Monday-first weeks padded with
// nulls so every week has 7 cells. fromDate/toDate bound the month for querying.
// All arithmetic runs in UTC millis, so days never shift under a timezone.
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

// Client mirror of the server shift-time util. Small duplication is acceptable
// on the client; this file is the single client-side source for shift time math.
export const parseHHmm = (value: string): number => {
  if (!HH_MM_PATTERN.test(value)) {
    throw new Error(`Invalid HH:mm time: ${value}`);
  }
  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
};

export const getIctMinutesOfDay = (at: Date): number => {
  const parts = ICT_TIME_OF_DAY_FORMATTER.formatToParts(at);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);

  return hour * 60 + minute;
};

// The minute-of-day the check-in window opens (startTime shifted earlier by the
// template's early padding). Wrapped into [0, 1440) for a stable HH:mm label.
export const getCheckInOpensAtMinutes = (
  startTime: string,
  earlyCheckInMinutes: number | null,
): number => {
  const opensAt = parseHHmm(startTime) - (earlyCheckInMinutes ?? 0);

  return ((opensAt % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
};

export const formatMinutesOfDay = (minutesOfDay: number): string => {
  const hours = Math.floor(minutesOfDay / 60);
  const minutes = minutesOfDay % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const getCheckInOpensAtLabel = (
  startTime: string,
  earlyCheckInMinutes: number | null,
): string =>
  formatMinutesOfDay(getCheckInOpensAtMinutes(startTime, earlyCheckInMinutes));

// Client-side UX guard for enabling "Check in". The server is the source of
// truth and rejects an out-of-window punch with a clear error, so this only
// gates the obvious cases:
//   - upper bound: the scheduled window hasn't fully elapsed yet (a past shift
//     is a missed one, never checkable — the bound the old lower-only guard was
//     missing, which let a past shift keep an enabled "Check in"),
//   - the shift is today (ICT), and
//   - lower bound: the early window has opened.
export const isCheckInWindowOpen = ({
  date,
  startTime,
  endTime,
  earlyCheckInMinutes,
  reference = new Date(),
}: {
  date: string;
  startTime: string | null;
  endTime: string | null;
  earlyCheckInMinutes: number | null;
  reference?: Date;
}): boolean => {
  if (hasShiftWindowEnded(date, startTime, endTime, reference)) {
    return false;
  }

  if (date !== getIctToday(reference)) {
    return false;
  }

  if (!isDefined(startTime)) {
    // No scheduled start to gate on — let the server have the final say.
    return true;
  }

  return (
    getIctMinutesOfDay(reference) >=
    parseHHmm(startTime) - (earlyCheckInMinutes ?? 0)
  );
};

// Scheduled window length in minutes; an overnight shift (end <= start) wraps
// past midnight, mirroring the server computeWindowMinutesOfDay convention.
export const getScheduledMinutes = (
  startTime: string | null,
  endTime: string | null,
): number => {
  if (!isDefined(startTime) || !isDefined(endTime)) {
    return 0;
  }

  const startMinutes = parseHHmm(startTime);
  let endMinutes = parseHHmm(endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += MINUTES_PER_DAY;
  }

  return endMinutes - startMinutes;
};

// Asia/Ho_Chi_Minh is a fixed +07:00 offset (no DST since 1975), so an ICT
// wall-clock time maps to a UTC instant by subtracting exactly 7 hours. This is
// the one reverse direction (wall-clock → instant) the window bounds need.
const ICT_UTC_OFFSET_MINUTES = 420;
const MILLISECONDS_PER_MINUTE = 60_000;

// The UTC instant a shift's scheduled window ends, from its ICT calendar date +
// snapshot start/end. Reuses getScheduledMinutes so overnight windows (end <=
// start) wrap past midnight exactly as the rest of the system measures them.
export const getShiftEndUtcMillis = (
  date: string,
  startTime: string,
  endTime: string,
): number => {
  const [year, month, day] = date.split('-').map(Number);
  const startMinutes = parseHHmm(startTime);
  const scheduledMinutes = getScheduledMinutes(startTime, endTime);

  return (
    Date.UTC(year, month - 1, day) +
    (startMinutes - ICT_UTC_OFFSET_MINUTES + scheduledMinutes) *
      MILLISECONDS_PER_MINUTE
  );
};

// The UTC instant a shift's scheduled window starts, from its ICT calendar date +
// snapshot start. Used to order shifts against each other on an absolute
// timeline (e.g. picking the handover from the shift immediately before this one).
export const getShiftStartUtcMillis = (
  date: string,
  startTime: string,
): number =>
  parseIsoDateToUtcMillis(date) +
  (parseHHmm(startTime) - ICT_UTC_OFFSET_MINUTES) * MILLISECONDS_PER_MINUTE;

// A shift's scheduled window has fully elapsed at `reference`. An unknown start
// or end can't be bounded, so it never counts as ended (the server has the final
// say on those).
export const hasShiftWindowEnded = (
  date: string,
  startTime: string | null,
  endTime: string | null,
  reference: Date = new Date(),
): boolean =>
  isDefined(startTime) &&
  isDefined(endTime) &&
  reference.getTime() > getShiftEndUtcMillis(date, startTime, endTime);

// "Missed": a member never checked in and the scheduled window has passed, so an
// UPCOMING shift is effectively an absence. Never a stored status — the same
// inference the Report page counts as "Absent".
export const isShiftMissed = (
  shift: {
    status: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    checkInAt: string | null;
  },
  reference: Date = new Date(),
): boolean =>
  shift.status === 'UPCOMING' &&
  !isDefined(shift.checkInAt) &&
  hasShiftWindowEnded(shift.date, shift.startTime, shift.endTime, reference);

// The handover left by the shift immediately before `shift` on the team timeline:
// the candidate whose scheduled end is the latest that still lands at or before
// this shift's scheduled start. Back-to-back shifts (previous end == this start)
// count. Null when this shift has no scheduled start, or nothing precedes it.
export const pickPrecedingHandover = <
  THandover extends {
    date: string;
    startTime: string | null;
    endTime: string | null;
  },
>({
  shift,
  handovers,
}: {
  shift: { date: string; startTime: string | null };
  handovers: THandover[];
}): THandover | null => {
  if (!isDefined(shift.startTime)) {
    return null;
  }

  const shiftStartMs = getShiftStartUtcMillis(shift.date, shift.startTime);

  let best: THandover | null = null;
  let bestEndMs = -Infinity;

  for (const handover of handovers) {
    if (!isDefined(handover.startTime) || !isDefined(handover.endTime)) {
      continue;
    }

    const endMs = getShiftEndUtcMillis(
      handover.date,
      handover.startTime,
      handover.endTime,
    );

    if (endMs <= shiftStartMs && endMs > bestEndMs) {
      best = handover;
      bestEndMs = endMs;
    }
  }

  return best;
};

// Completed working time as 'X.XXh' (e.g. 465 min → '7.75h').
export const formatWorkingHours = (workingMinutes: number): string =>
  `${(workingMinutes / 60).toFixed(2)}h`;

// Neutral weekly totals for the Register-page summary: total scheduled hours
// plus a shift count split by template dayKind, across BOTH already-registered
// shifts and the newly-selected cells. Cancelled shifts are excluded. There is
// deliberately no target/threshold judgement here — commitment reminders live
// outside this system, so the sidebar only ever shows plain numbers.
type WeekTotalsShift = {
  status: string;
  startTime: string | null;
  endTime: string | null;
  shiftTemplateId: string | null;
};

type WeekTotalsSelection = {
  templateId: string;
};

type WeekTotalsTemplate = {
  startTime: string;
  endTime: string;
  dayKind: string | null;
};

export const computeWeekTotals = ({
  shifts,
  selections,
  templatesById,
}: {
  shifts: WeekTotalsShift[];
  selections: WeekTotalsSelection[];
  templatesById: Record<string, WeekTotalsTemplate>;
}): {
  totalHours: number;
  totalShiftCount: number;
  weekdayShiftCount: number;
  weekendShiftCount: number;
} => {
  let totalMinutes = 0;
  let totalShiftCount = 0;
  let weekdayShiftCount = 0;
  let weekendShiftCount = 0;

  // HOLIDAY_OT (and any other non-regular dayKind) contributes to totalHours
  // and totalShiftCount so the two headline numbers never drift apart, but it
  // is deliberately excluded from weekdayShiftCount/weekendShiftCount — that
  // split is only for the two regular groups.
  const countByDayKind = (dayKind: string | null | undefined) => {
    if (dayKind === 'WEEKDAY') {
      weekdayShiftCount += 1;
    } else if (dayKind === 'WEEKEND') {
      weekendShiftCount += 1;
    }
  };

  for (const shift of shifts) {
    if (shift.status === 'CANCELLED') {
      continue;
    }

    // Registered shifts carry their own snapshotted window; classification
    // falls back to the live template's dayKind (absent if it was deactivated).
    totalMinutes += getScheduledMinutes(shift.startTime, shift.endTime);
    totalShiftCount += 1;

    const template = isDefined(shift.shiftTemplateId)
      ? templatesById[shift.shiftTemplateId]
      : undefined;

    countByDayKind(template?.dayKind);
  }

  for (const selection of selections) {
    const template = templatesById[selection.templateId];

    if (!isDefined(template)) {
      continue;
    }

    totalMinutes += getScheduledMinutes(template.startTime, template.endTime);
    totalShiftCount += 1;
    countByDayKind(template.dayKind);
  }

  // Round to hundredths of an hour so float-division noise never reaches the UI.
  return {
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    totalShiftCount,
    weekdayShiftCount,
    weekendShiftCount,
  };
};

type WeekTotalsSpecialDay = {
  kind: string;
  month: number | null;
  day: number | null;
  date: string | null;
};

// Which of `days` are special days: SPECIFIC matches an exact date, YEARLY
// matches month/day every year. Mirrors the server matching in
// ShiftRateWorkspaceService.getMultiplierForDate exactly — month/day are read
// from the 'YYYY-MM-DD' string by position, never via `new Date(...)`, so the
// comparison stays timezone-safe.
export const computeSpecialDayDatesInWeek = ({
  specialDays,
  days,
}: {
  specialDays: WeekTotalsSpecialDay[];
  days: string[];
}): Set<string> => {
  const matches = new Set<string>();

  for (const day of days) {
    const [, monthPart, dayPart] = day.split('-').map(Number);
    const isSpecial = specialDays.some((specialDay) =>
      specialDay.kind === 'SPECIFIC'
        ? specialDay.date === day
        : specialDay.month === monthPart && specialDay.day === dayPart,
    );

    if (isSpecial) {
      matches.add(day);
    }
  }

  return matches;
};

// Status → Tag color. Pure (no i18n) so both the Today panel and the week list
// share one mapping. Labels stay in the components (they need Lingui).
export const getShiftStatusTagColor = (status: string): ThemeColor => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'green';
    case 'COMPLETED':
      return 'gray';
    case 'CANCELLED':
      return 'red';
    case 'UPCOMING':
    default:
      return 'blue';
  }
};
