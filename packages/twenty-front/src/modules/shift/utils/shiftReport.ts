import { isDefined } from 'twenty-shared/utils';

import {
  getIctToday,
  getIctWeekRange,
  getScheduledMinutes,
  getShiftEndUtcMillis,
  isShiftMissed,
} from '@/shift/utils/shiftWeek';

const MILLISECONDS_PER_MINUTE = 60_000;
const MONTHS_PER_YEAR = 12;

// A check-out is "off" when it lands more than 15 minutes from the scheduled end
// of the window. The threshold is deliberately one-sided to check-out only — a
// late check-in is surfaced separately by checkInLateMinutes with no grace.
export const CHECK_OUT_DEVIATION_WARNING_MINUTES = 15;

const roundToHundredths = (value: number): number =>
  Math.round(value * 100) / 100;

export type ShiftWeekGroup<TShift> = {
  weekStart: string;
  weekEnd: string;
  shifts: TShift[];
  registeredHours: number;
  workingHours: number;
};

// Group a member's monthly shifts into ICT Mon–Sun weeks for the report table.
// Each group carries the week's registered hours (scheduled window of every
// non-cancelled shift) and total working hours (per-shift rounded then summed,
// the same CRM-1313 rule as the month total). Shifts inside a week are ordered by
// day, then by start time (00:00 → 24:00).
export const groupShiftsByWeek = <
  TShift extends {
    date: string;
    status: string;
    startTime: string | null;
    endTime: string | null;
    workingMinutes: number | null;
  },
>(
  shifts: TShift[],
): ShiftWeekGroup<TShift>[] => {
  const groupsByWeekStart = new Map<
    string,
    { weekStart: string; weekEnd: string; shifts: TShift[] }
  >();

  for (const shift of shifts) {
    // Noon UTC of the shift's ICT date lands squarely inside that ICT day, so the
    // week it maps to is stable and never drifts to an adjacent week.
    const { fromDate, toDate } = getIctWeekRange(
      new Date(`${shift.date}T12:00:00Z`),
    );
    const existing = groupsByWeekStart.get(fromDate) ?? {
      weekStart: fromDate,
      weekEnd: toDate,
      shifts: [],
    };

    existing.shifts.push(shift);
    groupsByWeekStart.set(fromDate, existing);
  }

  return [...groupsByWeekStart.values()]
    .sort((first, second) => first.weekStart.localeCompare(second.weekStart))
    .map((group) => {
      const orderedShifts = [...group.shifts].sort((first, second) =>
        first.date === second.date
          ? (first.startTime ?? '').localeCompare(second.startTime ?? '')
          : first.date.localeCompare(second.date),
      );

      let registeredMinutes = 0;
      let workingHours = 0;

      for (const shift of orderedShifts) {
        if (shift.status !== 'CANCELLED') {
          registeredMinutes += getScheduledMinutes(
            shift.startTime,
            shift.endTime,
          );
        }

        if (isDefined(shift.workingMinutes)) {
          workingHours += roundToHundredths(shift.workingMinutes / 60);
        }
      }

      return {
        weekStart: group.weekStart,
        weekEnd: group.weekEnd,
        shifts: orderedShifts,
        registeredHours: roundToHundredths(registeredMinutes / 60),
        workingHours: roundToHundredths(workingHours),
      };
    });
};

type MonthReportShift = {
  status: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  checkInAt: string | null;
  checkInLateMinutes: number | null;
  workingMinutes: number | null;
  rateMultiplier: number | null;
  shiftTemplateId: string | null;
};

type MonthReportTemplate = {
  salaryPerHour: number | null;
};

export type MonthReport = {
  registeredShiftCount: number;
  registeredHours: number;
  completedCount: number;
  absentCount: number;
  checkInLateCount: number;
  cancelledCount: number;
  totalWorkingHours: number;
  overtimeHours: number;
  // null when earnings can't be trusted: at least one completed shift's template
  // is missing salaryPerHour, so a total would silently under-count.
  earnings: number | null;
};

// The per-member monthly report numbers the PO reconciles at month end. Cancelled
// shifts are excluded from the registered totals but counted separately.
//
// Total working hours follows the SBC-BOSS CRM-1313 payroll rule: round EACH
// shift's hours to 2 decimals FIRST, then sum — never sum minutes and divide
// once, which drifts by a cent against payroll. Overtime and earnings reuse the
// same per-shift rounded hours for consistency.
export const computeMonthReport = (
  shifts: MonthReportShift[],
  templatesById: Record<string, MonthReportTemplate>,
  now: Date = new Date(),
): MonthReport => {
  let registeredShiftCount = 0;
  let registeredMinutes = 0;
  let completedCount = 0;
  let absentCount = 0;
  let checkInLateCount = 0;
  let cancelledCount = 0;
  let totalWorkingHours = 0;
  let overtimeHours = 0;

  let earnings = 0;
  let earningsAvailable = true;

  for (const shift of shifts) {
    if (shift.status === 'CANCELLED') {
      cancelledCount += 1;
    } else {
      registeredShiftCount += 1;
      registeredMinutes += getScheduledMinutes(shift.startTime, shift.endTime);
    }

    if (shift.status === 'COMPLETED') {
      completedCount += 1;
    }

    if (isShiftMissed(shift, now)) {
      absentCount += 1;
    }

    // No grace: any recorded lateness at all counts.
    if (isDefined(shift.checkInLateMinutes) && shift.checkInLateMinutes >= 1) {
      checkInLateCount += 1;
    }

    const workingHours = isDefined(shift.workingMinutes)
      ? roundToHundredths(shift.workingMinutes / 60)
      : 0;

    if (isDefined(shift.workingMinutes)) {
      totalWorkingHours += workingHours;

      if (isDefined(shift.rateMultiplier) && shift.rateMultiplier > 1) {
        overtimeHours += workingHours;
      }
    }

    if (shift.status === 'COMPLETED') {
      const template = isDefined(shift.shiftTemplateId)
        ? templatesById[shift.shiftTemplateId]
        : undefined;
      const salaryPerHour = template?.salaryPerHour;

      if (!isDefined(salaryPerHour)) {
        earningsAvailable = false;
      } else if (earningsAvailable) {
        earnings += workingHours * salaryPerHour * (shift.rateMultiplier ?? 1);
      }
    }
  }

  return {
    registeredShiftCount,
    registeredHours: roundToHundredths(registeredMinutes / 60),
    completedCount,
    absentCount,
    checkInLateCount,
    cancelledCount,
    totalWorkingHours: roundToHundredths(totalWorkingHours),
    overtimeHours: roundToHundredths(overtimeHours),
    earnings: earningsAvailable ? roundToHundredths(earnings) : null,
  };
};

// Absolute minutes between the actual check-out and the scheduled window end.
// null when the window or the check-out is unknown. Overnight-safe (via the
// shared getShiftEndUtcMillis). The table warns when this exceeds
// CHECK_OUT_DEVIATION_WARNING_MINUTES.
export const getCheckOutDeviationMinutes = (shift: {
  date: string;
  startTime: string | null;
  endTime: string | null;
  checkOutAt: string | null;
}): number | null => {
  if (
    !isDefined(shift.startTime) ||
    !isDefined(shift.endTime) ||
    !isDefined(shift.checkOutAt)
  ) {
    return null;
  }

  const scheduledEndUtcMillis = getShiftEndUtcMillis(
    shift.date,
    shift.startTime,
    shift.endTime,
  );
  const checkOutUtcMillis = new Date(shift.checkOutAt).getTime();

  return (
    Math.abs(checkOutUtcMillis - scheduledEndUtcMillis) /
    MILLISECONDS_PER_MINUTE
  );
};

// The last `count` months as 'YYYY-MM', most recent (current ICT month) first.
// Month arithmetic runs on a plain integer month index — never new Date(y, m, d)
// — so it can't drift under a timezone.
export const getRecentMonthValues = (
  count: number,
  reference: Date = new Date(),
): string[] => {
  const [year, month] = getIctToday(reference).split('-').map(Number);
  const currentMonthIndex = year * MONTHS_PER_YEAR + (month - 1);

  return Array.from({ length: count }, (_unused, offset) => {
    const monthIndex = currentMonthIndex - offset;
    const monthYear = Math.floor(monthIndex / MONTHS_PER_YEAR);
    const monthOfYear = (monthIndex % MONTHS_PER_YEAR) + 1;

    return `${monthYear}-${String(monthOfYear).padStart(2, '0')}`;
  });
};

// First → last ICT calendar day of a 'YYYY-MM' month, as 'YYYY-MM-DD' strings
// for the useMyShifts date range. Last-day count comes from Date.UTC day-0 of the
// next month (UTC millis, leap-year correct), not from constructing a local date.
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

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
});

// Human label for a 'YYYY-MM' value, e.g. 'August 2026'. Anchored at UTC day 1 so
// no timezone can roll it into an adjacent month.
export const formatMonthLabel = (monthValue: string): string => {
  const [year, month] = monthValue.split('-').map(Number);

  return MONTH_LABEL_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
};
