import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CAMPAIGNS_ON_TEMPLATE_FIELD_UID,
  EMAIL_CAMPAIGN_OBJECT_UID,
  EMAIL_TEMPLATE_OBJECT_UID,
  TEMPLATE_ON_CAMPAIGN_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: CAMPAIGNS_ON_TEMPLATE_FIELD_UID,
  objectUniversalIdentifier: EMAIL_TEMPLATE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'campaigns',
  label: 'Campaigns',
  icon: 'IconSpeakerphone',
  relationTargetObjectMetadataUniversalIdentifier: EMAIL_CAMPAIGN_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    TEMPLATE_ON_CAMPAIGN_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
