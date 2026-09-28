import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ALL_APPS_VIEW_UID,
  APP_NAME_FIELD_UID,
  APP_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_APPS_VIEW_UID,
  name: 'Apps',
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconApps',
  position: 0,
  fields: [
    {
      universalIdentifier: 'd97fe073-4237-491d-b58d-9c73743ec43c',
      fieldMetadataUniversalIdentifier: APP_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 260,
    },
    {
      universalIdentifier: '734cb4e8-1c37-46fb-bd24-a112a3beab16',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: APP_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 1,
      isVisible: true,
      size: 150,
    },
  ],
});
