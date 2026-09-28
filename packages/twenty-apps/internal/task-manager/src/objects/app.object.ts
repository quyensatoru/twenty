import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  APP_FIELD_SCHEMA_FIELD_UID,
  APP_NAME_FIELD_UID,
  APP_OBJECT_UID,
} from '../constants/universal-identifiers';

// `app` is the app-scope root's target: every project points at one, and the
// whole task-manager permission model resolves through it. Relation fields
// live in src/fields/ so both sides can be declared independently.
export default defineObject({
  universalIdentifier: APP_OBJECT_UID,
  nameSingular: 'app',
  namePlural: 'apps',
  labelSingular: 'App',
  labelPlural: 'Apps',
  description: 'A Shopify app used to scope data access',
  icon: 'IconApps',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: APP_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: APP_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'App name',
      icon: 'IconApps',
      isNullable: true,
    },
    {
      universalIdentifier: APP_FIELD_SCHEMA_FIELD_UID,
      type: FieldType.RAW_JSON,
      name: 'fieldSchema',
      label: 'Field Schema',
      description:
        "Schema (key/label/type) driving the Custom Settings form on this app's merchants",
      icon: 'IconForms',
      isNullable: true,
    },
  ],
});
