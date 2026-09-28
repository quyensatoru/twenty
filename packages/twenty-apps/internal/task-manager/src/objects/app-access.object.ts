import { defineObject, FieldType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import { APP_ACCESS_PERMISSION_OPTIONS } from '../constants/app-access-permission-options';
import {
  APP_ACCESS_OBJECT_UID,
  APP_ACCESS_PERMISSIONS_FIELD_UID,
} from '../constants/universal-identifiers';

// A grant of app-scoped permissions to a workspace member. Deliberately NOT an
// app-scope root even though it holds an FK to `app`: treating it as one would
// require a member to already hold a grant on an app before being allowed to
// delete that same grant.
export default defineObject({
  universalIdentifier: APP_ACCESS_OBJECT_UID,
  nameSingular: 'appAccess',
  namePlural: 'appAccesses',
  labelSingular: 'App Access',
  labelPlural: 'App Accesses',
  description: 'A grant of app-scoped permissions to a workspace member',
  icon: 'IconLock',
  // `id` is engine-derived, so it can never appear in `fields` below and
  // `twenty plan` warns that it cannot verify this identifier. The warning is
  // a false alarm here and the two alternatives are both worse: omitting the
  // identifier makes the engine synthesise a `name` column on the table, and
  // declaring `id` in `fields` is rejected outright with
  // FIELD_MUTATION_NOT_ALLOWED. The derived values are pinned by
  // __tests__/derived-label-identifiers.test.ts against what the engine stores.
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: APP_ACCESS_OBJECT_UID,
      name: 'id',
    }),
  fields: [
    {
      universalIdentifier: APP_ACCESS_PERMISSIONS_FIELD_UID,
      type: FieldType.MULTI_SELECT,
      name: 'permissions',
      label: 'Permissions',
      description: "Permissions granted on the app's scoped records",
      icon: 'IconLock',
      isNullable: true,
      options: [...APP_ACCESS_PERMISSION_OPTIONS],
    },
  ],
});
