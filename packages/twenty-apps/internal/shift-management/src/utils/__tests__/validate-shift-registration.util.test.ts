import { describe, expect, it } from 'vitest';

import { type ShiftTemplateRow } from '../../types/shift-template-row';
import { validateShiftRegistration } from '../validate-shift-registration.util';

const regularTemplate: ShiftTemplateRow = {
  id: 'template-1',
  code: 'SAE-TT-C',
  name: 'Ca chiều',
  startTime: '14:00',
  endTime: '19:00',
  dayKind: 'WEEKDAY',
  earlyCheckInMinutes: 15,
  lateCheckOutMinutes: 30,
  salaryPerHour: null,
  color: '#94a3b8',
  isActive: true,
};

const holidayOtTemplate: ShiftTemplateRow = {
  ...regularTemplate,
  id: 'template-ot',
  code: 'SAE-OT-S',
  name: 'OT sáng',
  dayKind: 'HOLIDAY_OT',
};

const validate = (
  overrides: Partial<Parameters<typeof validateShiftRegistration>[0]> = {},
) =>
  validateShiftRegistration({
    date: '2999-01-01',
    shiftTemplateId: 'template-1',
    requestedMemberId: null,
    actorMemberId: 'member-1',
    isElevatedActor: false,
    template: regularTemplate,
    shiftsOnSameSlot: [],
    specialDays: [],
    ...overrides,
  });

describe('validateShiftRegistration', () => {
  it('stamps the template snapshot and defaults the member to the acting member', () => {
    const outcome = validate();

    expect(outcome.ok).toBe(true);
    expect(outcome.ok && outcome.record).toMatchObject({
      memberId: 'member-1',
      templateCode: 'SAE-TT-C',
      templateName: 'Ca chiều',
      startTime: '14:00',
      endTime: '19:00',
      name: 'SAE-TT-C 2999-01-01',
      status: 'UPCOMING',
    });
  });

  it('nulls every attendance field at creation', () => {
    const outcome = validate();

    expect(outcome.ok && outcome.record).toMatchObject({
      checkInAt: null,
      checkOutAt: null,
      checkInLateMinutes: null,
      workingMinutes: null,
      cancelReason: null,
      cancelCategory: null,
      cancelledAt: null,
    });
  });

  it('rejects a registration for a past date', () => {
    const outcome = validate({ date: '2020-01-01' });

    expect(outcome).toEqual({
      ok: false,
      error: 'Cannot register a shift for a past date.',
    });
  });

  it('rejects a registration whose start time has already passed today', () => {
    // 2026-08-15T15:00:00Z is 22:00 ICT; today's 14:00 slot has already started.
    const outcome = validate({
      date: '2026-08-15',
      now: new Date('2026-08-15T15:00:00Z'),
    });

    expect(outcome).toEqual({
      ok: false,
      error: 'Cannot register a shift whose time has already passed.',
    });
  });

  it('rejects a registration without a shift template', () => {
    expect(validate({ shiftTemplateId: null })).toEqual({
      ok: false,
      error: 'A shift must reference a shift template.',
    });
  });

  it('rejects a registration on a missing template', () => {
    expect(validate({ template: null })).toEqual({
      ok: false,
      error: 'Shift template not found or inactive.',
    });
  });

  it('rejects a registration on an inactive template', () => {
    expect(
      validate({ template: { ...regularTemplate, isActive: false } }),
    ).toEqual({
      ok: false,
      error: 'Shift template not found or inactive.',
    });
  });

  it('stamps the OT multiplier from a matching special day', () => {
    const outcome = validate({
      date: '2999-09-02',
      specialDays: [
        { kind: 'YEARLY', month: 9, day: 2, date: null, multiplier: 2 },
      ],
    });

    expect(outcome.ok && outcome.record.rateMultiplier).toBe(2);
  });

  it('stamps no rate multiplier on an ordinary day', () => {
    const outcome = validate();

    expect(outcome.ok && outcome.record.rateMultiplier).toBeNull();
  });

  it('rejects a duplicate active registration for the same member/date/template', () => {
    const outcome = validate({
      shiftsOnSameSlot: [{ memberId: 'member-1', status: 'UPCOMING' }],
    });

    expect(outcome.ok).toBe(false);
    expect(!outcome.ok && outcome.error).toContain('already registered');
  });

  it('allows re-registration when the previous registration was cancelled', () => {
    const outcome = validate({
      shiftsOnSameSlot: [{ memberId: 'member-1', status: 'CANCELLED' }],
    });

    expect(outcome.ok && outcome.record.name).toBe('SAE-TT-C 2999-01-01');
  });

  it('rejects a HOLIDAY_OT slot already taken by ANOTHER member (OT slots are exclusive)', () => {
    const outcome = validate({
      shiftTemplateId: 'template-ot',
      template: holidayOtTemplate,
      shiftsOnSameSlot: [{ memberId: 'someone-else', status: 'UPCOMING' }],
    });

    expect(outcome.ok).toBe(false);
    expect(!outcome.ok && outcome.error).toContain('OT slot is already taken');
  });

  it('allows a regular shift when another member holds the same template/date', () => {
    const outcome = validate({
      shiftsOnSameSlot: [{ memberId: 'someone-else', status: 'UPCOMING' }],
    });

    expect(outcome.ok && outcome.record.memberId).toBe('member-1');
  });

  it('rejects an ordinary member registering a shift for someone else', () => {
    expect(validate({ requestedMemberId: 'member-2' })).toEqual({
      ok: false,
      error: 'You can only register shifts for yourself.',
    });
  });

  it('lets an elevated actor register on behalf of another member', () => {
    const outcome = validate({
      requestedMemberId: 'member-2',
      isElevatedActor: true,
    });

    expect(outcome.ok && outcome.record.memberId).toBe('member-2');
  });

  it('rejects a registration with no member at all', () => {
    expect(validate({ actorMemberId: null })).toEqual({
      ok: false,
      error: 'A shift must belong to a workspace member.',
    });
  });
});
