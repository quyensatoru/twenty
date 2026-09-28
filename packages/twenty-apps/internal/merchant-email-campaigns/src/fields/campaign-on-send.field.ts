import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_ON_SEND_FIELD_UID,
  EMAIL_CAMPAIGN_OBJECT_UID,
  EMAIL_SEND_OBJECT_UID,
  SENDS_ON_CAMPAIGN_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: CAMPAIGN_ON_SEND_FIELD_UID,
  objectUniversalIdentifier: EMAIL_SEND_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'campaign',
  label: 'Campaign',
  icon: 'IconSpeakerphone',
  relationTargetObjectMetadataUniversalIdentifier: EMAIL_CAMPAIGN_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: SENDS_ON_CAMPAIGN_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'campaignId',
  },
});
