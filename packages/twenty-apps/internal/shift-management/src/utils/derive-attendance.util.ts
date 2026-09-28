import {
  computeCheckInLateMinutes,
  computePayableMinutes,
} from './shift-time.util';

export type DerivedAttendance = {
  status: string;
  workingMinutes: number | null;
  checkInLateMinutes: number | null;
};

type AttendanceShift = {
  date: string;
  startTime: string | null;
  endTime: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
};

// Scheduling rule: the shift's snapshot startTime/endTime (frozen at
// registration) are the authoritative scheduled window. Payable time is capped
// at that window's own length; with no scheduled window the full elapsed time
// is paid (see computePayableMinutes).
export const deriveAttendance = (shift: AttendanceShift): DerivedAttendance => {
  const { startTime, endTime } = shift;

  // Only meaningful once there is a punch to check; stays null for the no-punch
  // (UPCOMING) case below without ever calling into the util.
  const checkInLateMinutes =
    shift.checkInAt !== null && startTime !== null
      ? computeCheckInLateMinutes({
          date: shift.date,
          startTime,
          checkInAt: new Date(shift.checkInAt),
        })
      : null;

  if (shift.checkInAt !== null && shift.checkOutAt !== null) {
    return {
      status: 'COMPLETED',
      workingMinutes: computePayableMinutes({
        checkInAt: new Date(shift.checkInAt),
        checkOutAt: new Date(shift.checkOutAt),
        startTime,
        endTime,
      }),
      checkInLateMinutes,
    };
  }

  if (shift.checkInAt !== null) {
    return {
      status: 'IN_PROGRESS',
      workingMinutes: null,
      checkInLateMinutes,
    };
  }

  return {
    status: 'UPCOMING',
    workingMinutes: null,
    checkInLateMinutes: null,
  };
};

// A CANCELLED shift is terminal — its numbers are frozen and must never be
// re-derived from stray punch edits. Returns null when nothing would change, so
// the caller can skip a pointless write.
export const getAttendanceRecomputePatch = (
  shift: AttendanceShift & {
    status: string;
    workingMinutes: number | null;
    checkInLateMinutes: number | null;
  },
): DerivedAttendance | null => {
  if (shift.status === 'CANCELLED') {
    return null;
  }

  const derived = deriveAttendance(shift);

  const isUnchanged =
    derived.status === shift.status &&
    derived.workingMinutes === shift.workingMinutes &&
    derived.checkInLateMinutes === shift.checkInLateMinutes;

  return isUnchanged ? null : derived;
};
