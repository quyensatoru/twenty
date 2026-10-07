import { describe, expect, it } from 'vitest';

import { type CallerScope } from '../../../types/caller-scope';
import { hasAppGrant } from '../has-app-grant.util';

const buildScope = (overrides: Partial<CallerScope> = {}): CallerScope => ({
  workspaceMemberId: 'member-1',
  grantsByAppId: { 'app-1': ['read', 'write'], 'app-2': ['read'] },
  canBypassAppScope: false,
  ...overrides,
});

describe('hasAppGrant', () => {
  it('grants an operation the caller holds on the app', () => {
    expect(hasAppGrant(buildScope(), 'app-1', 'write')).toBe(true);
  });

  it('denies an operation the caller lacks on the app', () => {
    expect(hasAppGrant(buildScope(), 'app-2', 'write')).toBe(false);
    expect(hasAppGrant(buildScope(), 'app-1', 'softDelete')).toBe(false);
  });

  it('denies an app the caller has no grant on', () => {
    expect(hasAppGrant(buildScope(), 'app-3', 'read')).toBe(false);
  });

  it('denies a record with no app', () => {
    expect(hasAppGrant(buildScope(), null, 'read')).toBe(false);
  });

  it('grants everything to a caller who bypasses app-scope', () => {
    const scope = buildScope({ canBypassAppScope: true, grantsByAppId: {} });

    expect(hasAppGrant(scope, null, 'softDelete')).toBe(true);
    expect(hasAppGrant(scope, 'app-3', 'write')).toBe(true);
  });
});
