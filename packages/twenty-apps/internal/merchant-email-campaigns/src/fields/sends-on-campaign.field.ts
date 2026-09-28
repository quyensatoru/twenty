import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CAMPAIGN_ON_SEND_FIELD_UID,
  EMAIL_CAMPAIGN_OBJECT_UID,
  EMAIL_SEND_OBJECT_UID,
  SENDS_ON_CAMPAIGN_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: SENDS_ON_CAMPAIGN_FIELD_UID,
  objectUniversalIdentifier: EMAIL_CAMPAIGN_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'sends',
  label: 'Sends',
  icon: 'IconMailForward',
  relationTargetObjectMetadataUniversalIdentifier: EMAIL_SEND_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: CAMPAIGN_ON_SEND_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
