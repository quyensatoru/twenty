import { describe, expect, it } from 'vitest';

import { APP_SCOPE_PATH_BY_OBJECT } from '../../constants/app-scope-paths';
import {
  EPIC_OBJECT_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_STATUS_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  PROJECT_OBJECT_UID,
  SPRINT_OBJECT_UID,
  WORKLOG_OBJECT_UID,
} from '../../constants/universal-identifiers';
import appScopedMemberRole from '../app-scoped-member.role';

const OBJECT_UID_BY_NAME: Record<string, string> = {
  project: PROJECT_OBJECT_UID,
  merchant: MERCHANT_OBJECT_UID,
  issue: ISSUE_OBJECT_UID,
  sprint: SPRINT_OBJECT_UID,
  epic: EPIC_OBJECT_UID,
  issueStatus: ISSUE_STATUS_OBJECT_UID,
  issueComment: ISSUE_COMMENT_OBJECT_UID,
  worklog: WORKLOG_OBJECT_UID,
  issueMerchant: ISSUE_MERCHANT_OBJECT_UID,
};

const predicatedObjectUniversalIdentifiers = new Set(
  (appScopedMemberRole.config.rowLevelPermissionPredicates ?? []).map(
    (predicate) => predicate.objectUniversalIdentifier,
  ),
);

// The routes and the role enforce app-scope on two different paths: a route
// walks APP_SCOPE_PATH_BY_OBJECT, the role compiles a predicate the ORM applies
// to every read. An object listed in the table but missing from the role is a
// hole that nothing fails on — `merchant` sat in exactly that state, refused by
// every route while the record table handed over all of them.
describe('app-scoped member role', () => {
  const scopedObjectNames = Object.entries(APP_SCOPE_PATH_BY_OBJECT)
    .filter(([, path]) => Array.isArray(path))
    .map(([objectName]) => objectName);

  it.each(scopedObjectNames)(
    'carries a row-level predicate for %s',
    (objectName) => {
      const objectUniversalIdentifier = OBJECT_UID_BY_NAME[objectName];

      expect(objectUniversalIdentifier).toBeDefined();
      expect(
        predicatedObjectUniversalIdentifiers.has(objectUniversalIdentifier),
      ).toBe(true);
    },
  );

  it('scopes every predicate by the member scopedAppIds mirror', () => {
    for (const predicate of appScopedMemberRole.config
      .rowLevelPermissionPredicates ?? []) {
      expect(predicate.workspaceMemberFieldUniversalIdentifier).toBeDefined();
    }
  });
});
