import { isDefined } from 'twenty-shared/utils';

const ICT_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const HH_MM_PATTERN = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;
// ICT is a fixed +07:00 offset (no DST since 1975), so an ICT wall-clock time
// maps to a UTC instant by subtracting exactly 7 hours.
const ICT_UTC_OFFSET_MINUTES = 420;
const MILLISECONDS_PER_MINUTE = 60_000;

export const parseHHmm = (value: string): number => {
  if (!HH_MM_PATTERN.test(value)) {
    throw new Error(`Invalid HH:mm time: ${value}`);
  }
  const [hours, minutes] = value.split(':').map(Number);

  return hours * 60 + minutes;
};

// 'en-CA' returns YYYY-MM-DD directly; never build ICT dates with new Date(y, m, d)
export const getTodayIct = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ICT_TIME_ZONE }).format(now);

export const getIctMinutesOfDay = (at: Date): number => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ICT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);

  return hour * 60 + minute;
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

// The UTC instant a shift's scheduled window ends, from its ICT calendar date +
// snapshot start/end. Overnight windows (end <= start) wrap past midnight. Used
// to gate check-in: once this instant has passed the shift is missed, not
// checkable.
export const getShiftEndUtcMillis = (
  date: string,
  startTime: string,
  endTime: string,
): number => {
  const [year, month, day] = date.split('-').map(Number);
  const startMinutes = parseHHmm(startTime);
  let endMinutes = parseHHmm(endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += 1440;
  }

  return (
    Date.UTC(year, month - 1, day) +
    (endMinutes - ICT_UTC_OFFSET_MINUTES) * MILLISECONDS_PER_MINUTE
  );
};

// Payable time = actual elapsed between check-in and check-out, capped at the
// shift's own scheduled length (endTime − startTime, overnight-aware). Early
// check-in or late check-out never earns more than the ca's hours: a 00:00–05:00
// shift punched 23:30 → 05:30 still pays 5h. A shift with no scheduled window
// (null start/end) has nothing to cap against, so the full elapsed time is paid.
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

  if (!isDefined(startTime) || !isDefined(endTime)) {
    return elapsedMinutes;
  }

  const startMinutes = parseHHmm(startTime);
  let endMinutes = parseHHmm(endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += 1440;
  }

  const scheduledMinutes = endMinutes - startMinutes;

  return scheduledMinutes > 0
    ? Math.min(elapsedMinutes, scheduledMinutes)
    : elapsedMinutes;
};

// BR-9.1: NO grace. On time = punch at/before shift start; >=1 minute past is late.
// Discipline flag only — does not affect payable minutes.
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
  // near-midnight shift); other cases are leader backfill, still correct within ±1 day
  const dayOffset =
    punchDateIct > date ? 1440 : punchDateIct < date ? -1440 : 0;
  const lateMinutes =
    getIctMinutesOfDay(checkInAt) + dayOffset - parseHHmm(startTime);

  return lateMinutes >= 1 ? lateMinutes : null;
};
