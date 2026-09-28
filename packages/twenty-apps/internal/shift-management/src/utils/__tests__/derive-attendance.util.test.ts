import { describe, expect, it } from 'vitest';

import { getAttendanceRecomputePatch } from '../derive-attendance.util';

const baseShift = {
  date: '2026-08-11',
  startTime: '14:00',
  endTime: '19:00',
  checkInAt: null as string | null,
  checkOutAt: null as string | null,
  status: 'UPCOMING',
  checkInLateMinutes: null as number | null,
  workingMinutes: null as number | null,
};

describe('getAttendanceRecomputePatch', () => {
  it('completes the shift, recomputes capped payable minutes and the late flag when both punches are set', () => {
    expect(
      getAttendanceRecomputePatch({
        ...baseShift,
        status: 'IN_PROGRESS',
        checkInAt: '2026-08-11T07:05:00Z', // 14:05 ICT -> late +5 (NO grace)
        checkOutAt: '2026-08-11T12:05:00Z', // 19:05 ICT
      }),
    ).toEqual({
      status: 'COMPLETED',
      workingMinutes: 300,
      checkInLateMinutes: 5,
    });
  });

  it('moves a shift with only a check-in to IN_PROGRESS with null workingMinutes', () => {
    expect(
      getAttendanceRecomputePatch({
        ...baseShift,
        checkInAt: '2026-08-11T07:05:00Z',
      }),
    ).toEqual({
      status: 'IN_PROGRESS',
      workingMinutes: null,
      checkInLateMinutes: 5,
    });
  });

  it('resets a shift with both punches cleared back to UPCOMING', () => {
    expect(
      getAttendanceRecomputePatch({
        ...baseShift,
        status: 'IN_PROGRESS',
        checkInLateMinutes: 5,
      }),
    ).toEqual({
      status: 'UPCOMING',
      workingMinutes: null,
      checkInLateMinutes: null,
    });
  });

  it('never touches a CANCELLED shift', () => {
    expect(
      getAttendanceRecomputePatch({
        ...baseShift,
        status: 'CANCELLED',
        checkInAt: '2026-08-11T07:05:00Z',
        checkOutAt: '2026-08-11T12:05:00Z',
      }),
    ).toBeNull();
  });

  it('writes when exactly one derived field is stale', () => {
    expect(
      getAttendanceRecomputePatch({
        ...baseShift,
        status: 'COMPLETED',
        checkInAt: '2026-08-11T07:05:00Z',
        checkOutAt: '2026-08-11T12:05:00Z',
        // Stale: the punch implies +5, not 0.
        checkInLateMinutes: 0,
        workingMinutes: 300,
      }),
    ).toEqual({
      status: 'COMPLETED',
      workingMinutes: 300,
      checkInLateMinutes: 5,
    });
  });

  it('skips the write when nothing would change', () => {
    expect(
      getAttendanceRecomputePatch({
        ...baseShift,
        status: 'COMPLETED',
        checkInAt: '2026-08-11T07:05:00Z',
        checkOutAt: '2026-08-11T12:05:00Z',
        checkInLateMinutes: 5,
        workingMinutes: 300,
      }),
    ).toBeNull();
  });
});
