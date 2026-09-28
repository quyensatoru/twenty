import { describe, expect, it } from 'vitest';

import {
  APP_SCOPE_PATH_BY_OBJECT,
  APP_SCOPE_UNASSIGNED_VISIBLE_OBJECTS,
  HOP_TARGET_BY_FIELD_NAME,
  PLURAL_NAME_BY_OBJECT,
} from '../../../constants/app-scope-paths';

describe('APP_SCOPE_PATH_BY_OBJECT', () => {
  it('marks project and merchant as app-scope roots', () => {
    expect(APP_SCOPE_PATH_BY_OBJECT.project).toEqual([]);
    expect(APP_SCOPE_PATH_BY_OBJECT.merchant).toEqual([]);
  });

  it('scopes app by its own id', () => {
    expect(APP_SCOPE_PATH_BY_OBJECT.app).toBe('IS_APP_ITSELF');
  });

  // Excluding appAccess is what stops a member needing a grant on an app
  // before being allowed to delete a grant on that same app.
  it('leaves appAccess unscoped', () => {
    expect(APP_SCOPE_PATH_BY_OBJECT.appAccess).toBeNull();
  });

  it('routes the one-hop objects through project', () => {
    for (const objectName of ['issue', 'sprint', 'epic', 'issueStatus']) {
      expect(APP_SCOPE_PATH_BY_OBJECT[objectName]).toEqual(['project']);
    }
  });

  it('routes comments and worklogs through issue then project', () => {
    expect(APP_SCOPE_PATH_BY_OBJECT.issueComment).toEqual(['issue', 'project']);
    expect(APP_SCOPE_PATH_BY_OBJECT.worklog).toEqual(['issue', 'project']);
  });

  it('takes the shortest path for the merchant junction', () => {
    expect(APP_SCOPE_PATH_BY_OBJECT.issueMerchant).toEqual(['merchant']);
  });

  it('can resolve every hop it declares', () => {
    for (const scopePath of Object.values(APP_SCOPE_PATH_BY_OBJECT)) {
      if (!Array.isArray(scopePath)) {
        continue;
      }

      for (const fieldName of scopePath) {
        const targetObject = HOP_TARGET_BY_FIELD_NAME[fieldName];

        expect(targetObject).toBeDefined();
        expect(PLURAL_NAME_BY_OBJECT[targetObject]).toBeDefined();
      }
    }
  });

  it('keeps every object fail-closed while unassigned', () => {
    expect(APP_SCOPE_UNASSIGNED_VISIBLE_OBJECTS).toEqual([]);
  });
});
