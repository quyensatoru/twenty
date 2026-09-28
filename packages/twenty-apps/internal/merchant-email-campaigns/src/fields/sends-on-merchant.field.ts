import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  EMAIL_SEND_OBJECT_UID,
  MERCHANT_OBJECT_UID,
  MERCHANT_ON_SEND_FIELD_UID,
  SENDS_ON_MERCHANT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: SENDS_ON_MERCHANT_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'emailSends',
  label: 'Email sends',
  icon: 'IconMailForward',
  relationTargetObjectMetadataUniversalIdentifier: EMAIL_SEND_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: MERCHANT_ON_SEND_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
