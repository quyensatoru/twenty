import { defineView, ViewType } from 'twenty-sdk/define';

import {
  APP_APP_ACCESSES_FIELD_UID,
  APP_FIELD_SCHEMA_FIELD_UID,
  APP_NAME_FIELD_UID,
  APP_OBJECT_UID,
  APP_PROJECTS_FIELD_UID,
  APP_RECORD_PAGE_FIELDS_VIEW_UID,
} from '../constants/universal-identifiers';

// The FIELDS widget needs a view of its own: without one the host falls back
// to buildDefaultFieldsWidgetGroups, which hides every RELATION field with no
// way to reach it and makes its own field editor unsaveable
// (`fields-widget-upsert.service.ts` throws "Fields widget has no associated
// view"). Same reason the issue record page ships one.
export default defineView({
  universalIdentifier: APP_RECORD_PAGE_FIELDS_VIEW_UID,
  name: 'App Record Page Fields',
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: ViewType.FIELDS_WIDGET,
  fields: [
    {
      universalIdentifier: '2ec2bcc6-6c1d-4958-be0d-9b3d14f30a3d',
      fieldMetadataUniversalIdentifier: APP_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier: '5ee11b11-f0fe-474b-85b0-5bcd644b67f3',
      fieldMetadataUniversalIdentifier: APP_FIELD_SCHEMA_FIELD_UID,
      position: 1,
      isVisible: true,
    },
    {
      universalIdentifier: '109514bf-0e9e-47e2-88d9-bd2670c6b65b',
      fieldMetadataUniversalIdentifier: APP_PROJECTS_FIELD_UID,
      position: 2,
      isVisible: true,
    },
    {
      universalIdentifier: '876e4c7a-b5a3-41e0-a8eb-8053da9dd72a',
      fieldMetadataUniversalIdentifier: APP_APP_ACCESSES_FIELD_UID,
      position: 3,
      isVisible: true,
    },
  ],
});
