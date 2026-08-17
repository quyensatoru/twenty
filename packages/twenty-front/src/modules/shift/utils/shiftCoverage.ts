import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import {
  addDaysToIsoDate,
  getShiftStartUtcMillis,
  parseHHmm,
} from '@/shift/utils/shiftWeek';

const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;

// One matrix row is a fixed hour band (00:00, 01:00 … 23:00). The rows never
// depend on the shift templates — coverage is derived purely from each shift's
// own start/end window overlapping the hour — so changing a template or a shift's
// times never breaks the grid, and weekday/weekend shifts share one clean axis.
export type CoverageHourRow = {
  hour: number;
  label: string;
};

export type CoverageCell = {
  count: number;
  memberNames: string[];
};

export type CoverageMatrix = {
  rows: CoverageHourRow[];
  // Keyed `${day}|${hour}`; every (day, hour) pair is present. A cell is a gap
  // when count === 0, otherwise covered.
  cells: Record<string, CoverageCell>;
  // 24/7 means every hour of every day is expected to be staffed, so the
  // denominator is simply days × 24.
  expectedCount: number;
  coveredCount: number;
  gapCount: number;
  coveragePercent: number | null;
  totalShiftCount: number;
  staffCount: number;
};

export const coverageCellKey = (day: string, hour: number): string =>
  `${day}|${hour}`;

export type AttendanceStats = {
  startedCount: number;
  attendedCount: number;
  attendancePercent: number | null;
};

// Attendance over the roster: of the shifts whose scheduled start has already
// passed, how many the member actually showed up for (status IN_PROGRESS or
// COMPLETED — a check-in flips a shift off UPCOMING). Shifts that haven't started
// yet are excluded so the ratio isn't dragged down by shifts that simply haven't
// happened. Derived from `status` alone — no attendance timestamp is needed.
export const computeAttendance = (
  roster: { date: string; startTime: string | null; status: string }[],
  reference: Date = new Date(),
): AttendanceStats => {
  const now = reference.getTime();
  let startedCount = 0;
  let attendedCount = 0;

  for (const entry of roster) {
    if (!isNonEmptyString(entry.startTime)) {
      continue;
    }

    if (now < getShiftStartUtcMillis(entry.date, entry.startTime)) {
      continue;
    }

    startedCount += 1;

    if (entry.status === 'IN_PROGRESS' || entry.status === 'COMPLETED') {
      attendedCount += 1;
    }
  }

  return {
    startedCount,
    attendedCount,
    attendancePercent:
      startedCount > 0
        ? Math.round((attendedCount / startedCount) * 100)
        : null,
  };
};

const formatHourLabel = (hour: number): string =>
  `${String(hour).padStart(2, '0')}:00`;

type CoverageRosterEntry = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  memberId: string | null;
  memberName: string | null;
};

// Build the 24×N coverage grid from the team roster (non-cancelled shifts). Each
// shift covers every whole hour its [start, end) window overlaps; overnight
// windows (end <= start) spill their after-midnight hours onto the next calendar
// day. Distinct members are counted per cell. Pure and deterministic.
export const buildCoverageMatrix = ({
  roster,
  days,
}: {
  roster: CoverageRosterEntry[];
  days: string[];
}): CoverageMatrix => {
  const daySet = new Set(days);

  const rows: CoverageHourRow[] = Array.from(
    { length: HOURS_PER_DAY },
    (_unused, hour) => ({ hour, label: formatHourLabel(hour) }),
  );

  // (day, hour) → distinct memberKey → memberName.
  const membersByCell = new Map<string, Map<string, string>>();
  const staffIds = new Set<string>();

  for (const entry of roster) {
    if (isNonEmptyString(entry.memberId)) {
      staffIds.add(entry.memberId);
    }

    if (
      !isNonEmptyString(entry.startTime) ||
      !isNonEmptyString(entry.endTime)
    ) {
      continue;
    }

    const startMinutes = parseHHmm(entry.startTime);
    let endMinutes = parseHHmm(entry.endTime);

    if (endMinutes <= startMinutes) {
      endMinutes += MINUTES_PER_DAY;
    }

    const firstHour = Math.floor(startMinutes / MINUTES_PER_HOUR);
    // The last whole hour the window still overlaps: an 09:00–17:00 shift covers
    // hours 9..16 (17:00 itself starts the uncovered 17th hour).
    const lastHour = Math.ceil(endMinutes / MINUTES_PER_HOUR) - 1;

    for (
      let absoluteHour = firstHour;
      absoluteHour <= lastHour;
      absoluteHour++
    ) {
      const dayOffset = Math.floor(absoluteHour / HOURS_PER_DAY);
      const hourOfDay = absoluteHour - dayOffset * HOURS_PER_DAY;
      const targetDate =
        dayOffset === 0 ? entry.date : addDaysToIsoDate(entry.date, dayOffset);

      if (!daySet.has(targetDate)) {
        continue;
      }

      const cellKey = coverageCellKey(targetDate, hourOfDay);
      const memberKey = entry.memberId ?? entry.id;
      const cellMembers =
        membersByCell.get(cellKey) ?? new Map<string, string>();

      cellMembers.set(memberKey, entry.memberName ?? '—');
      membersByCell.set(cellKey, cellMembers);
    }
  }

  const cells: Record<string, CoverageCell> = {};
  let coveredCount = 0;

  for (const day of days) {
    for (const row of rows) {
      const cellKey = coverageCellKey(day, row.hour);
      const members = membersByCell.get(cellKey);
      const count = members?.size ?? 0;

      if (count > 0) {
        coveredCount += 1;
      }

      cells[cellKey] = {
        count,
        memberNames: isDefined(members) ? [...members.values()] : [],
      };
    }
  }

  const expectedCount = days.length * HOURS_PER_DAY;

  return {
    rows,
    cells,
    expectedCount,
    coveredCount,
    gapCount: expectedCount - coveredCount,
    coveragePercent:
      expectedCount > 0
        ? Math.round((coveredCount / expectedCount) * 100)
        : null,
    totalShiftCount: roster.length,
    staffCount: staffIds.size,
  };
};
