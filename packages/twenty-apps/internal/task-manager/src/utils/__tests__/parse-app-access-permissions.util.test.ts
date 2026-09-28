import { describe, expect, it } from 'vitest';

import { buildGrantsByAppId } from '../build-grants-by-app-id.util';
import { listGrantedAppIds } from '../list-granted-app-ids.util';
import { parseAppAccessPermissions } from '../parse-app-access-permissions.util';

describe('parseAppAccessPermissions', () => {
  it('maps the stored option values onto the operation vocabulary', () => {
    expect(
      parseAppAccessPermissions(['READ', 'WRITE', 'SOFT_DELETE', 'DESTROY']),
    ).toEqual(['read', 'write', 'softDelete', 'destroy']);
  });

  it('drops unknown and non-string entries', () => {
    expect(parseAppAccessPermissions(['READ', 'NONSENSE', 7, null])).toEqual([
      'read',
    ]);
  });

  it('returns nothing when permissions are absent', () => {
    expect(parseAppAccessPermissions(null)).toEqual([]);
    expect(parseAppAccessPermissions(undefined)).toEqual([]);
  });
});

describe('buildGrantsByAppId', () => {
  it('unions the permissions of several grants on the same app', () => {
    expect(
      buildGrantsByAppId([
        { appId: 'app-1', permissions: ['READ'] },
        { appId: 'app-1', permissions: ['WRITE'] },
        { appId: 'app-2', permissions: ['READ'] },
      ]),
    ).toEqual({ 'app-1': ['read', 'write'], 'app-2': ['read'] });
  });

  it('ignores rows with no app', () => {
    expect(buildGrantsByAppId([{ appId: null, permissions: ['READ'] }])).toEqual(
      {},
    );
  });
});

describe('listGrantedAppIds', () => {
  it('returns only the apps granting the requested operation', () => {
    expect(
      listGrantedAppIds(
        { 'app-1': ['read'], 'app-2': ['read', 'write'] },
        'write',
      ),
    ).toEqual(['app-2']);
  });
});
