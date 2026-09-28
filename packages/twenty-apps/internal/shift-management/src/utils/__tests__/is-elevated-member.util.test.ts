import { describe, expect, it } from 'vitest';

import { isElevatedMember } from '../is-elevated-member.util';

describe('isElevatedMember', () => {
  it('elevates a workspace admin regardless of the allow list', () => {
    expect(
      isElevatedMember({
        email: 'someone@example.com',
        permissionFlags: ['WORKSPACE_MEMBERS'],
        leaderEmails: undefined,
      }),
    ).toBe(true);
  });

  it('elevates an email on the allow list, case- and space-insensitively', () => {
    expect(
      isElevatedMember({
        email: '  Leader@Example.com ',
        permissionFlags: [],
        leaderEmails: 'other@example.com, leader@example.com',
      }),
    ).toBe(true);
  });

  it('does not elevate an email absent from the allow list', () => {
    expect(
      isElevatedMember({
        email: 'member@example.com',
        permissionFlags: ['VIEWS'],
        leaderEmails: 'leader@example.com',
      }),
    ).toBe(false);
  });

  it('elevates everyone when the allow list is *', () => {
    expect(
      isElevatedMember({
        email: 'member@example.com',
        permissionFlags: [],
        leaderEmails: '*',
      }),
    ).toBe(true);
  });

  it('does not elevate when the variable is unset', () => {
    expect(
      isElevatedMember({
        email: 'member@example.com',
        permissionFlags: [],
        leaderEmails: undefined,
      }),
    ).toBe(false);
  });

  it('does not elevate an anonymous caller even with a non-empty allow list', () => {
    expect(
      isElevatedMember({
        email: null,
        permissionFlags: [],
        leaderEmails: 'leader@example.com',
      }),
    ).toBe(false);
  });
});
