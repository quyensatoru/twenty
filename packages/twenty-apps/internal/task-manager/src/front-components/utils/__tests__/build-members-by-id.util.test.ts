import { describe, expect, it } from 'vitest';

import { buildMembersById } from '../build-members-by-id.util';
import { readMemberName } from '../read-member-name.util';

describe('buildMembersById', () => {
  it('names a reader who is only in the discussion member list', () => {
    const membersById = buildMembersById(
      [{ id: 'author', name: { firstName: 'Ann', lastName: 'Lee' } }],
      [{ id: 'reader', name: { firstName: 'Bao', lastName: 'Tran' } }],
    );

    expect(readMemberName(membersById, 'reader', 'Unknown')).toBe('Bao Tran');
    expect(readMemberName(membersById, 'author', 'Unknown')).toBe('Ann Lee');
  });

  it('keeps the first list entry when a member appears twice', () => {
    const membersById = buildMembersById(
      [{ id: 'member', name: { firstName: 'From', lastName: 'Detail' } }],
      [{ id: 'member', name: { firstName: 'From', lastName: 'Discussion' } }],
      undefined,
    );

    expect(readMemberName(membersById, 'member', 'Unknown')).toBe(
      'From Detail',
    );
  });
});
