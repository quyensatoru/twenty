import { describe, expect, it } from 'vitest';

import { type BcMemberRecord } from '../../../types/bc-records';
import {
  buildBcScope,
  buildVisibleClientFilter,
  canSeeClientOf,
} from '../resolve-bc-scope.util';

const membership = (overrides: Partial<BcMemberRecord>): BcMemberRecord => ({
  id: 'membership',
  name: null,
  memberRole: 'BC',
  crispOperatorNames: null,
  isActive: true,
  memberId: 'me',
  teamId: 'team-a',
  ...overrides,
});

describe('buildBcScope', () => {
  it('limits a BC to the clients they own, without finance', () => {
    const scope = buildBcScope({
      workspaceMemberId: 'me',
      memberName: 'Me',
      isAdmin: false,
      memberships: [membership({})],
      teamMembers: [],
    });

    expect(scope.role).toBe('BC');
    expect(scope.canSeeFinance).toBe(false);
    expect(canSeeClientOf(scope, 'me')).toBe(true);
    expect(canSeeClientOf(scope, 'someone-else')).toBe(false);
    expect(canSeeClientOf(scope, null)).toBe(false);
  });

  it('lets a manager see their own team only, plus the unassigned clients of that team', () => {
    const scope = buildBcScope({
      workspaceMemberId: 'me',
      memberName: 'Me',
      isAdmin: false,
      memberships: [membership({ memberRole: 'MANAGER' })],
      teamMembers: [
        membership({ memberId: 'bc-1' }),
        membership({ memberId: 'bc-2', teamId: 'team-b' }),
      ],
    });

    expect(scope.role).toBe('MANAGER');
    expect(scope.canSeeFinance).toBe(true);
    expect(canSeeClientOf(scope, 'bc-1')).toBe(true);
    expect(canSeeClientOf(scope, 'bc-2')).toBe(false);
    expect(canSeeClientOf(scope, null, 'team-a')).toBe(true);
    expect(canSeeClientOf(scope, null, 'team-b')).toBe(false);
    expect(canSeeClientOf(scope, null, null)).toBe(false);
    expect(buildVisibleClientFilter(scope)).toEqual({
      or: [
        { picId: { in: ['me', 'bc-1'] } },
        { and: [{ picId: { is: 'NULL' } }, { teamId: { in: ['team-a'] } }] },
      ],
    });
  });

  it('gives someone outside every team nothing', () => {
    const scope = buildBcScope({
      workspaceMemberId: 'me',
      memberName: 'Me',
      isAdmin: false,
      memberships: [membership({ isActive: false })],
      teamMembers: [],
    });

    expect(scope.role).toBe('NONE');
    expect(buildVisibleClientFilter(scope)).toEqual({ id: { is: 'NULL' } });
  });
});
