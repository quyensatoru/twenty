import { type ShiftTemplateRow } from '../types/shift-template-row';
import { resolveRateMultiplier } from './resolve-rate-multiplier.util';
import { getShiftStartUtcMillis, getTodayIct } from './shift-time.util';

type ExistingShift = {
  memberId: string | null;
  status: string;
};

type SpecialDayForRate = {
  kind: string;
  month: number | null;
  day: number | null;
  date: string | null;
  multiplier: number;
};

export type StampedShift = {
  date: string;
  memberId: string;
  shiftTemplateId: string;
  name: string;
  templateCode: string;
  templateName: string;
  startTime: string;
  endTime: string;
  status: 'UPCOMING';
  checkInAt: null;
  checkOutAt: null;
  checkInLateMinutes: null;
  workingMinutes: null;
  cancelReason: null;
  cancelCategory: null;
  cancelledAt: null;
  rateMultiplier: number | null;
};

export type ShiftRegistrationOutcome =
  | { ok: true; record: StampedShift }
  | { ok: false; error: string };

// The fork's validate-and-stamp-shift-create.util.ts, minus the data access:
// the caller fetches the template, the day's existing shifts and the active
// special days, this decides. Keeping it pure is what makes the registration
// rules testable without a workspace.
export const validateShiftRegistration = ({
  date,
  shiftTemplateId,
  requestedMemberId,
  actorMemberId,
  isElevatedActor,
  template,
  shiftsOnSameSlot,
  specialDays,
  now = new Date(),
}: {
  date: string | null;
  shiftTemplateId: string | null;
  requestedMemberId: string | null;
  actorMemberId: string | null;
  isElevatedActor: boolean;
  template: ShiftTemplateRow | null;
  shiftsOnSameSlot: ExistingShift[];
  specialDays: SpecialDayForRate[];
  now?: Date;
}): ShiftRegistrationOutcome => {
  // Members register for themselves; only an elevated actor (Leader/PO) may
  // register on behalf of someone else.
  const targetMemberId = requestedMemberId ?? actorMemberId;

  if (targetMemberId === null) {
    return { ok: false, error: 'A shift must belong to a workspace member.' };
  }

  if (targetMemberId !== actorMemberId && !isElevatedActor) {
    return {
      ok: false,
      error: 'You can only register shifts for yourself.',
    };
  }

  if (date === null || date < getTodayIct(now)) {
    return { ok: false, error: 'Cannot register a shift for a past date.' };
  }

  if (shiftTemplateId === null) {
    return { ok: false, error: 'A shift must reference a shift template.' };
  }

  if (template === null || !template.isActive) {
    return { ok: false, error: 'Shift template not found or inactive.' };
  }

  // A future date passes the day check above, but a slot whose start time has
  // already passed today is settled — you can't register a shift that has begun.
  if (now.getTime() >= getShiftStartUtcMillis(date, template.startTime)) {
    return {
      ok: false,
      error: 'Cannot register a shift whose time has already passed.',
    };
  }

  const activeShifts = shiftsOnSameSlot.filter(
    (shift) => shift.status !== 'CANCELLED',
  );

  if (activeShifts.some((shift) => shift.memberId === targetMemberId)) {
    return {
      ok: false,
      error: `This member is already registered for ${template.code} on ${date}.`,
    };
  }

  // TC rule "Không đăng kí trùng ca nhau": HOLIDAY_OT slots are team-wide
  // exclusive — one person per OT slot per day. Regular shifts are only unique
  // per member (checked above).
  if (template.dayKind === 'HOLIDAY_OT' && activeShifts.length > 0) {
    return {
      ok: false,
      error: `This OT slot is already taken (${template.code} on ${date}).`,
    };
  }

  const rateMultiplier = resolveRateMultiplier(specialDays, date);

  return {
    ok: true,
    record: {
      date,
      memberId: targetMemberId,
      shiftTemplateId,
      name: `${template.code} ${date}`,
      templateCode: template.code,
      templateName: template.name,
      startTime: template.startTime,
      endTime: template.endTime,
      status: 'UPCOMING',
      // Attendance fields are never client-writable at creation — the check-in,
      // check-out and cancel routes own the punches.
      checkInAt: null,
      checkOutAt: null,
      checkInLateMinutes: null,
      workingMinutes: null,
      cancelReason: null,
      cancelCategory: null,
      cancelledAt: null,
      rateMultiplier: rateMultiplier > 1 ? rateMultiplier : null,
    },
  };
};
