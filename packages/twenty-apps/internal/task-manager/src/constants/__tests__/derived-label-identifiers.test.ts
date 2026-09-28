import { describe, expect, it } from 'vitest';

import { getSystemFieldUniversalIdentifier } from '../derived-system-field-identifiers';
import {
  APP_ACCESS_OBJECT_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  WORKLOG_OBJECT_UID,
} from '../universal-identifiers';

// `twenty plan` warns that it cannot verify a label identifier naming an
// engine-derived field, because the identifier is not in the object's `fields`
// array — and for `id` it never can be. Both ways of silencing that warning are
// worse than the warning: omitting the identifier makes the engine synthesise a
// `name` column on the table, and declaring `id` in `fields` fails outright
// with FIELD_MUTATION_NOT_ALLOWED.
//
// So the identifier stays declared and this test carries the check the SDK
// cannot. The expected values were read out of core."fieldMetadata" on a
// database that had been through the cutover, so drift in either the derivation
// formula or the application identifier fails here rather than during an apply
// against production.
const ENGINE_STORED_ID_FIELD_UNIVERSAL_IDENTIFIERS = {
  appAccess: {
    objectUniversalIdentifier: APP_ACCESS_OBJECT_UID,
    idFieldUniversalIdentifier: '1521275b-3adc-5703-a0e9-d6470dda30de',
  },
  issueComment: {
    objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
    idFieldUniversalIdentifier: '2498f1e1-4358-58bd-be4b-3ee84bea802e',
  },
  issueMerchant: {
    objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
    idFieldUniversalIdentifier: '79bf2392-f396-527c-b1e6-f0f038479892',
  },
  worklog: {
    objectUniversalIdentifier: WORKLOG_OBJECT_UID,
    idFieldUniversalIdentifier: '60aa551a-5373-548a-8983-13acfa9ee59c',
  },
} as const;

describe('derived label identifiers', () => {
  it.each(Object.entries(ENGINE_STORED_ID_FIELD_UNIVERSAL_IDENTIFIERS))(
    'derives the id field identifier the engine stores for %s',
    (_objectName, { objectUniversalIdentifier, idFieldUniversalIdentifier }) => {
      expect(
        getSystemFieldUniversalIdentifier({
          objectUniversalIdentifier,
          name: 'id',
        }),
      ).toBe(idFieldUniversalIdentifier);
    },
  );

  it('derives a distinct identifier per object', () => {
    const derived = Object.values(
      ENGINE_STORED_ID_FIELD_UNIVERSAL_IDENTIFIERS,
    ).map(({ objectUniversalIdentifier }) =>
      getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier,
        name: 'id',
      }),
    );

    expect(new Set(derived).size).toBe(derived.length);
  });
});
