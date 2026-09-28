import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ALL_APP_ACCESSES_VIEW_UID,
  APP_ACCESS_APP_FIELD_UID,
  APP_ACCESS_MEMBER_FIELD_UID,
  APP_ACCESS_OBJECT_UID,
  APP_ACCESS_PERMISSIONS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_APP_ACCESSES_VIEW_UID,
  name: 'App Accesses',
  objectUniversalIdentifier: APP_ACCESS_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconLock',
  position: 0,
  fields: [
    {
      universalIdentifier: 'b56b0efd-24ba-4fd9-81db-274358900571',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: APP_ACCESS_OBJECT_UID,
        name: 'id',
      }),
      position: 0,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '2132c185-a07b-4c97-9c39-f089b053e9e3',
      fieldMetadataUniversalIdentifier: APP_ACCESS_MEMBER_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '464950bb-b3d8-4074-8ac2-0c6dcb6b8c18',
      fieldMetadataUniversalIdentifier: APP_ACCESS_APP_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '3d94b8e0-8818-4b34-be96-6d545335623f',
      fieldMetadataUniversalIdentifier: APP_ACCESS_PERMISSIONS_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 180,
    },
  ],
});
