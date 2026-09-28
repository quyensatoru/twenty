import { CANCEL_CATEGORIES } from '../constants/cancel-category-options';
import { type ShiftRow } from '../types/shift-row';
import {
  computeCheckInLateMinutes,
  computePayableMinutes,
  getCheckInOpensAtLabel,
  getIctMinutesOfDay,
  getShiftEndUtcMillis,
  getTodayIct,
  parseHHmm,
} from './shift-time.util';

export const MIN_CANCEL_REASON_LENGTH = 10;

export type AttendanceOutcome<TPatch> =
  | { ok: true; patch: TPatch }
  | { ok: false; error: string };

export type CheckInPatch = {
  checkInAt: string;
  status: 'IN_PROGRESS';
  checkInLateMinutes: number | null;
};

export type CheckOutPatch = {
  checkOutAt: string;
  status: 'COMPLETED';
  workingMinutes: number;
  handoverNote?: string;
};

export type CancelPatch = {
  status: 'CANCELLED';
  cancelReason: string;
  cancelCategory: string;
  cancelledAt: string;
};

// BR-9.x check-in. The early-window guard is a no-op unless the template's
// padding is configured (null = off) and the shift is today with a scheduled
// start. The upper bound is independent of that padding: once the scheduled
// window has fully elapsed the shift is missed, not checkable.
export const validateCheckIn = ({
  shift,
  earlyCheckInMinutes,
  now = new Date(),
}: {
  shift: ShiftRow;
  earlyCheckInMinutes: number | null;
  now?: Date;
}): AttendanceOutcome<CheckInPatch> => {
  if (shift.status !== 'UPCOMING') {
    return { ok: false, error: 'Shift is not open for check-in.' };
  }

  if (shift.checkInAt !== null) {
    return { ok: false, error: 'Already checked in.' };
  }

  if (
    earlyCheckInMinutes !== null &&
    shift.startTime !== null &&
    shift.date === getTodayIct(now)
  ) {
    const opensAtMinutes = parseHHmm(shift.startTime) - earlyCheckInMinutes;

    if (getIctMinutesOfDay(now) < opensAtMinutes) {
      return {
        ok: false,
        error: `Too early to check in — opens ${getCheckInOpensAtLabel(
          shift.startTime,
          earlyCheckInMinutes,
        )} ICT.`,
      };
    }
  }

  if (
    shift.startTime !== null &&
    shift.endTime !== null &&
    now.getTime() >
      getShiftEndUtcMillis(shift.date, shift.startTime, shift.endTime)
  ) {
    return {
      ok: false,
      error: 'Too late to check in — the shift window has ended.',
    };
  }

  return {
    ok: true,
    patch: {
      checkInAt: now.toISOString(),
      status: 'IN_PROGRESS',
      // BR-9.1: NO grace — punching >=1 minute past start is late.
      checkInLateMinutes:
        shift.startTime !== null
          ? computeCheckInLateMinutes({
              date: shift.date,
              startTime: shift.startTime,
              checkInAt: now,
            })
          : null,
    },
  };
};

export const validateCheckOut = ({
  shift,
  handoverNote,
  now = new Date(),
}: {
  shift: ShiftRow;
  handoverNote: string | null;
  now?: Date;
}): AttendanceOutcome<CheckOutPatch> => {
  if (shift.checkInAt === null) {
    return { ok: false, error: 'Not checked in yet.' };
  }

  if (shift.checkOutAt !== null) {
    return { ok: false, error: 'Already checked out.' };
  }

  const trimmedNote = handoverNote?.trim() ?? '';

  return {
    ok: true,
    patch: {
      checkOutAt: now.toISOString(),
      status: 'COMPLETED',
      workingMinutes: computePayableMinutes({
        checkInAt: new Date(shift.checkInAt),
        checkOutAt: now,
        startTime: shift.startTime,
        endTime: shift.endTime,
      }),
      ...(trimmedNote.length > 0 ? { handoverNote: trimmedNote } : {}),
    },
  };
};

export const validateCancel = ({
  shift,
  reason,
  category,
  now = new Date(),
}: {
  shift: ShiftRow;
  reason: string;
  category: string;
  now?: Date;
}): AttendanceOutcome<CancelPatch> => {
  if (reason.trim().length < MIN_CANCEL_REASON_LENGTH) {
    return {
      ok: false,
      error: `Cancel reason must be at least ${MIN_CANCEL_REASON_LENGTH} characters.`,
    };
  }

  if (!(CANCEL_CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, error: `Invalid cancel category: ${category}` };
  }

  if (shift.status === 'CANCELLED') {
    return { ok: false, error: 'This shift is already cancelled.' };
  }

  if (shift.status === 'COMPLETED') {
    return { ok: false, error: 'Completed shifts cannot be cancelled.' };
  }

  // A shift whose scheduled window has fully elapsed is settled and can no
  // longer be cancelled — a past adjustment is a leader's record edit, not a
  // member cancel. Mirrors the client, which hides cancel for past shifts.
  if (
    shift.startTime !== null &&
    shift.endTime !== null &&
    now.getTime() >
      getShiftEndUtcMillis(shift.date, shift.startTime, shift.endTime)
  ) {
    return {
      ok: false,
      error: 'This shift has already ended and can no longer be cancelled.',
    };
  }

  return {
    ok: true,
    patch: {
      status: 'CANCELLED',
      cancelReason: reason.trim(),
      cancelCategory: category,
      cancelledAt: now.toISOString(),
    },
  };
};
