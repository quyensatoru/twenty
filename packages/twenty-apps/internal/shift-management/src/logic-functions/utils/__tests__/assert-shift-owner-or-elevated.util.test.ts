import { describe, expect, it } from 'vitest';

import { readShiftOwnershipError } from '../assert-shift-owner-or-elevated.util';

const member = {
  workspaceMemberId: 'member-1',
  email: 'member@example.com',
  isElevated: false,
};

const leader = { ...member, isElevated: true };

describe('readShiftOwnershipError', () => {
  it('lets the shift owner through', () => {
    expect(
      readShiftOwnershipError({ actor: member, shiftMemberId: 'member-1' }),
    ).toBeNull();
  });

  it("denies a member acting on someone else's shift", () => {
    expect(
      readShiftOwnershipError({ actor: member, shiftMemberId: 'member-2' }),
    ).toBe('Permission denied.');
  });

  it('denies a member acting on an unassigned shift', () => {
    expect(
      readShiftOwnershipError({ actor: member, shiftMemberId: null }),
    ).toBe('Permission denied.');
  });

  it('lets an elevated actor through on any shift', () => {
    expect(
      readShiftOwnershipError({ actor: leader, shiftMemberId: 'member-2' }),
    ).toBeNull();
  });

  it('denies a caller with no workspace member', () => {
    expect(
      readShiftOwnershipError({
        actor: { ...member, workspaceMemberId: null },
        shiftMemberId: null,
      }),
    ).toBe('Permission denied.');
  });
});
