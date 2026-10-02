import { defineView, ViewType } from 'twenty-sdk/define';

import {
  APP_ACCESS_APP_FIELD_UID,
  APP_ACCESS_MEMBER_FIELD_UID,
  APP_ACCESS_OBJECT_UID,
  APP_ACCESS_PERMISSIONS_FIELD_UID,
  APP_ACCESS_RECORD_PAGE_FIELDS_VIEW_UID,
} from '../constants/universal-identifiers';

// See app-record-page-fields.view.ts for why a FIELDS widget must have a view.
export default defineView({
  universalIdentifier: APP_ACCESS_RECORD_PAGE_FIELDS_VIEW_UID,
  name: 'App Access Record Page Fields',
  objectUniversalIdentifier: APP_ACCESS_OBJECT_UID,
  type: ViewType.FIELDS_WIDGET,
  fields: [
    {
      universalIdentifier: 'c8a54adf-c378-4e14-814f-2bd86ece662e',
      fieldMetadataUniversalIdentifier: APP_ACCESS_MEMBER_FIELD_UID,
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier: 'd17bd5e9-b6e6-4907-b4f1-0834d112b362',
      fieldMetadataUniversalIdentifier: APP_ACCESS_APP_FIELD_UID,
      position: 1,
      isVisible: true,
    },
    {
      universalIdentifier: '55f9e5db-1caa-425b-933a-ca0e717d7311',
      fieldMetadataUniversalIdentifier: APP_ACCESS_PERMISSIONS_FIELD_UID,
      position: 2,
      isVisible: true,
    },
  ],
});
