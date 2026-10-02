import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ALL_MERCHANTS_VIEW_UID,
  MERCHANT_NAME_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_MERCHANTS_VIEW_UID,
  name: 'Merchants',
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconBuildingStore',
  position: 0,
  fields: [
    {
      universalIdentifier: '45427ed5-8e2f-489e-85c7-f320e1c09080',
      fieldMetadataUniversalIdentifier: MERCHANT_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 260,
    },
    {
      // Derived from (application, object, name), so this value CHANGES with
      // the move: the same column is a different identifier under a new
      // owner. The migration rewrites the stored ones to match before the
      // first sync — see MIGRATION.md.
      universalIdentifier: '36d9829a-0c96-4a68-bec1-6753a04cf43d',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: MERCHANT_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 1,
      isVisible: true,
      size: 150,
    },
  ],
});
