// Shift time math. The fork kept two copies of this (server shift-time.util.ts
// and front shiftWeek.ts); the app has one, shared by the logic functions and
// the front components, because both run out of the same package.

const ICT_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const HH_MM_PATTERN = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;
// ICT is a fixed +07:00 offset (no DST since 1975), so an ICT wall-clock time
// maps to a UTC instant by subtracting exactly 7 hours.
const ICT_UTC_OFFSET_MINUTES = 420;
const MILLISECONDS_PER_MINUTE = 60_000;
export const MINUTES_PER_DAY = 1440;
export const MILLISECONDS_PER_DAY = 86_400_000;

// 'en-CA' returns YYYY-MM-DD directly; never build ICT dates with
// new Date(year, month, day).
const ICT_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: ICT_TIME_ZONE,
});

const ICT_TIME_OF_DAY_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: ICT_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export const parseHHmm = (value: string): number => {
  if (!HH_MM_PATTERN.test(value)) {
    throw new Error(`Invalid HH:mm time: ${value}`);
  }
  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
};

export const getTodayIct = (now: Date = new Date()): string =>
  ICT_DATE_FORMATTER.format(now);

export const getIctMinutesOfDay = (at: Date): number => {
  const parts = ICT_TIME_OF_DAY_FORMATTER.formatToParts(at);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);

  return hour * 60 + minute;
};

export const formatMinutesOfDay = (minutesOfDay: number): string => {
  const hours = Math.floor(minutesOfDay / 60);
  const minutes = minutesOfDay % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Scheduled window length in minutes; an overnight shift (end <= start) wraps
// past midnight.
export const getScheduledMinutes = (
  startTime: string | null,
  endTime: string | null,
): number => {
  if (startTime === null || endTime === null) {
    return 0;
  }

  const startMinutes = parseHHmm(startTime);
  let endMinutes = parseHHmm(endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += MINUTES_PER_DAY;
  }

  return endMinutes - startMinutes;
};

// The UTC instant a shift's scheduled window starts, from its ICT calendar date
// + snapshot start. Used to gate registration: once the start has passed the
// shift is already underway and can no longer be registered.
export const getShiftStartUtcMillis = (
  date: string,
  startTime: string,
): number => {
  const [year, month, day] = date.split('-').map(Number);

  return (
    Date.UTC(year, month - 1, day) +
    (parseHHmm(startTime) - ICT_UTC_OFFSET_MINUTES) * MILLISECONDS_PER_MINUTE
  );
};

// The UTC instant a shift's scheduled window ends. Overnight windows
// (end <= start) wrap past midnight. Used to gate check-in: once this instant
// has passed the shift is missed, not checkable.
export const getShiftEndUtcMillis = (
  date: string,
  startTime: string,
  endTime: string,
): number =>
  getShiftStartUtcMillis(date, startTime) +
  getScheduledMinutes(startTime, endTime) * MILLISECONDS_PER_MINUTE;

// Payable time = actual elapsed between check-in and check-out, capped at the
// shift's own scheduled length (endTime - startTime, overnight-aware). Early
// check-in or late check-out never earns more than the shift's hours: a
// 00:00-05:00 shift punched 23:30 -> 05:30 still pays 5h. A shift with no
// scheduled window (null start/end) has nothing to cap against, so the full
// elapsed time is paid.
export const computePayableMinutes = ({
  checkInAt,
  checkOutAt,
  startTime,
  endTime,
}: {
  checkInAt: Date;
  checkOutAt: Date;
  startTime: string | null;
  endTime: string | null;
}): number => {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((checkOutAt.getTime() - checkInAt.getTime()) / 60_000),
  );

  if (startTime === null || endTime === null) {
    return elapsedMinutes;
  }

  const scheduledMinutes = getScheduledMinutes(startTime, endTime);

  return scheduledMinutes > 0
    ? Math.min(elapsedMinutes, scheduledMinutes)
    : elapsedMinutes;
};

// BR-9.1: NO grace. On time = punch at/before shift start; >=1 minute past is
// late. Discipline flag only — does not affect payable minutes.
export const computeCheckInLateMinutes = ({
  date,
  startTime,
  checkInAt,
}: {
  date: string;
  startTime: string;
  checkInAt: Date;
}): number | null => {
  const punchDateIct = getTodayIct(checkInAt);
  // A punch lands on the shift's ICT date or the next day (late for a
  // near-midnight shift); other cases are leader backfill, still correct
  // within +/-1 day.
  const dayOffset =
    punchDateIct > date ? MINUTES_PER_DAY : punchDateIct < date ? -MINUTES_PER_DAY : 0;
  const lateMinutes =
    getIctMinutesOfDay(checkInAt) + dayOffset - parseHHmm(startTime);

  return lateMinutes >= 1 ? lateMinutes : null;
};

// A shift's scheduled window has fully elapsed at `reference`. An unknown start
// or end can't be bounded, so it never counts as ended (the server has the
// final say on those).
export const hasShiftWindowEnded = (
  date: string,
  startTime: string | null,
  endTime: string | null,
  reference: Date = new Date(),
): boolean =>
  startTime !== null &&
  endTime !== null &&
  reference.getTime() > getShiftEndUtcMillis(date, startTime, endTime);

// "Missed": a member never checked in and the scheduled window has passed, so
// an UPCOMING shift is effectively an absence. Never a stored status — the same
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
  shift.checkInAt === null &&
  hasShiftWindowEnded(shift.date, shift.startTime, shift.endTime, reference);

// The minute-of-day the check-in window opens (startTime shifted earlier by the
// template's early padding). Wrapped into [0, 1440) for a stable HH:mm label.
export const getCheckInOpensAtMinutes = (
  startTime: string,
  earlyCheckInMinutes: number | null,
): number => {
  const opensAt = parseHHmm(startTime) - (earlyCheckInMinutes ?? 0);

  return ((opensAt % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
};

export const getCheckInOpensAtLabel = (
  startTime: string,
  earlyCheckInMinutes: number | null,
): string =>
  formatMinutesOfDay(getCheckInOpensAtMinutes(startTime, earlyCheckInMinutes));

// Client-side UX guard for enabling "Check in". The route is the source of
// truth and rejects an out-of-window punch with a clear error, so this only
// gates the obvious cases: the scheduled window hasn't fully elapsed yet, the
// shift is today (ICT), and the early window has opened.
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

  if (date !== getTodayIct(reference)) {
    return false;
  }

  if (startTime === null) {
    // No scheduled start to gate on — let the route have the final say.
    return true;
  }

  return (
    getIctMinutesOfDay(reference) >=
    parseHHmm(startTime) - (earlyCheckInMinutes ?? 0)
  );
};

// Completed working time as 'X.XXh' (e.g. 465 min -> '7.75h').
export const formatWorkingHours = (workingMinutes: number): string =>
  `${(workingMinutes / 60).toFixed(2)}h`;
