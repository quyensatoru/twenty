import {
  buildCoverageMatrix,
  computeAttendance,
  coverageCellKey,
} from '@/shift/utils/shiftCoverage';

const DAY = '2026-08-10';
const NEXT_DAY = '2026-08-11';

describe('buildCoverageMatrix', () => {
  it('has 24 hourly rows labelled HH:00 regardless of the roster', () => {
    const matrix = buildCoverageMatrix({ roster: [], days: [DAY] });

    expect(matrix.rows).toHaveLength(24);
    expect(matrix.rows[0].label).toBe('00:00');
    expect(matrix.rows[23].label).toBe('23:00');
  });

  it('covers each whole hour a shift window overlaps, with distinct headcount', () => {
    const matrix = buildCoverageMatrix({
      days: [DAY],
      roster: [
        {
          id: 's1',
          date: DAY,
          startTime: '00:00',
          endTime: '05:00',
          memberId: 'm1',
          memberName: 'Alice',
        },
        {
          id: 's2',
          date: DAY,
          startTime: '00:00',
          endTime: '05:00',
          memberId: 'm2',
          memberName: 'Bob',
        },
        {
          id: 's3',
          date: DAY,
          startTime: '14:00',
          endTime: '19:00',
          memberId: 'm1',
          memberName: 'Alice',
        },
      ],
    });

    // 00:00–05:00 covers hours 0..4 with two distinct members.
    expect(matrix.cells[coverageCellKey(DAY, 0)].count).toBe(2);
    expect(matrix.cells[coverageCellKey(DAY, 4)].count).toBe(2);
    expect(matrix.cells[coverageCellKey(DAY, 0)].memberNames.sort()).toEqual([
      'Alice',
      'Bob',
    ]);
    // Hour 5 (05:00–06:00) is the start of the uncovered hour — the shift ends 05:00.
    expect(matrix.cells[coverageCellKey(DAY, 5)].count).toBe(0);
    // 14:00–19:00 covers hours 14..18, not 19.
    expect(matrix.cells[coverageCellKey(DAY, 14)].count).toBe(1);
    expect(matrix.cells[coverageCellKey(DAY, 18)].count).toBe(1);
    expect(matrix.cells[coverageCellKey(DAY, 19)].count).toBe(0);
  });

  it('treats end-of-day 24:00 as covering through hour 23', () => {
    const matrix = buildCoverageMatrix({
      days: [DAY],
      roster: [
        {
          id: 's',
          date: DAY,
          startTime: '19:00',
          endTime: '24:00',
          memberId: 'm1',
          memberName: 'A',
        },
      ],
    });

    expect(matrix.cells[coverageCellKey(DAY, 19)].count).toBe(1);
    expect(matrix.cells[coverageCellKey(DAY, 23)].count).toBe(1);
  });

  it('spills an overnight window onto the next calendar day', () => {
    const matrix = buildCoverageMatrix({
      days: [DAY, NEXT_DAY],
      roster: [
        {
          id: 's',
          date: DAY,
          startTime: '22:00',
          endTime: '02:00',
          memberId: 'm1',
          memberName: 'A',
        },
      ],
    });

    expect(matrix.cells[coverageCellKey(DAY, 21)].count).toBe(0);
    expect(matrix.cells[coverageCellKey(DAY, 22)].count).toBe(1);
    expect(matrix.cells[coverageCellKey(DAY, 23)].count).toBe(1);
    expect(matrix.cells[coverageCellKey(NEXT_DAY, 0)].count).toBe(1);
    expect(matrix.cells[coverageCellKey(NEXT_DAY, 1)].count).toBe(1);
    expect(matrix.cells[coverageCellKey(NEXT_DAY, 2)].count).toBe(0);
  });

  it('computes 24/7 KPIs over days × 24 hours', () => {
    const matrix = buildCoverageMatrix({
      days: [DAY],
      roster: [
        {
          id: 's1',
          date: DAY,
          startTime: '00:00',
          endTime: '05:00',
          memberId: 'm1',
          memberName: 'Alice',
        },
        {
          id: 's2',
          date: DAY,
          startTime: '14:00',
          endTime: '19:00',
          memberId: 'm2',
          memberName: 'Bob',
        },
      ],
    });

    // Covered hours: 0..4 (5) + 14..18 (5) = 10 of 24.
    expect(matrix.expectedCount).toBe(24);
    expect(matrix.coveredCount).toBe(10);
    expect(matrix.gapCount).toBe(14);
    expect(matrix.coveragePercent).toBe(42);
    expect(matrix.totalShiftCount).toBe(2);
    expect(matrix.staffCount).toBe(2);
  });
});

describe('computeAttendance', () => {
  // 2026-08-14T15:00:00Z = 22:00 ICT — so a 23:00 shift has not started yet.
  const reference = new Date('2026-08-14T15:00:00Z');

  it('counts attendance only over shifts whose start has already passed', () => {
    const stats = computeAttendance(
      [
        { date: '2026-08-14', startTime: '05:00', status: 'COMPLETED' },
        // Started but never checked in → still UPCOMING → absent.
        { date: '2026-08-14', startTime: '10:00', status: 'UPCOMING' },
        { date: '2026-08-14', startTime: '14:00', status: 'IN_PROGRESS' },
        // Not started yet → excluded from the ratio.
        { date: '2026-08-14', startTime: '23:00', status: 'UPCOMING' },
        // No scheduled start → skipped.
        { date: '2026-08-14', startTime: null, status: 'COMPLETED' },
      ],
      reference,
    );

    expect(stats.startedCount).toBe(3);
    expect(stats.attendedCount).toBe(2);
    expect(stats.attendancePercent).toBe(67);
  });

  it('is null when no shift has started yet', () => {
    const stats = computeAttendance(
      [{ date: '2026-08-14', startTime: '23:00', status: 'UPCOMING' }],
      reference,
    );

    expect(stats.startedCount).toBe(0);
    expect(stats.attendancePercent).toBeNull();
  });
});
