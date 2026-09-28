import {
  getScheduledMinutes,
  getShiftEndUtcMillis,
  getShiftStartUtcMillis,
} from './shift-time.util';

// The handover left by the shift immediately before `shift` on the team
// timeline: the candidate whose scheduled end is the latest that still lands at
// or before this shift's scheduled start. Back-to-back shifts (previous end ==
// this start) count. Null when this shift has no scheduled start, or nothing
// precedes it.
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
  if (shift.startTime === null) {
    return null;
  }

  const shiftStartMillis = getShiftStartUtcMillis(shift.date, shift.startTime);

  let best: THandover | null = null;
  let bestEndMillis = -Infinity;

  for (const handover of handovers) {
    if (handover.startTime === null || handover.endTime === null) {
      continue;
    }

    const endMillis = getShiftEndUtcMillis(
      handover.date,
      handover.startTime,
      handover.endTime,
    );

    if (endMillis <= shiftStartMillis && endMillis > bestEndMillis) {
      best = handover;
      bestEndMillis = endMillis;
    }
  }

  return best;
};

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

// Neutral weekly totals for the Register-page summary: total scheduled hours
// plus a shift count split by template dayKind, across BOTH already-registered
// shifts and the newly-selected cells. Cancelled shifts are excluded. There is
// deliberately no target/threshold judgement here — commitment reminders live
// outside this system, so the sidebar only ever shows plain numbers.
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

    const template =
      shift.shiftTemplateId !== null
        ? templatesById[shift.shiftTemplateId]
        : undefined;

    countByDayKind(template?.dayKind);
  }

  for (const selection of selections) {
    const template = templatesById[selection.templateId];

    if (template === undefined) {
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
// matches month/day every year. Mirrors resolveRateMultiplier exactly — month
// and day are read from the 'YYYY-MM-DD' string by position, never via
// `new Date(...)`, so the comparison stays timezone-safe.
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
