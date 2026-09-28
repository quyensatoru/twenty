import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CAMPAIGNS_ON_TEMPLATE_FIELD_UID,
  EMAIL_CAMPAIGN_OBJECT_UID,
  EMAIL_TEMPLATE_OBJECT_UID,
  TEMPLATE_ON_CAMPAIGN_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: TEMPLATE_ON_CAMPAIGN_FIELD_UID,
  objectUniversalIdentifier: EMAIL_CAMPAIGN_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'template',
  label: 'Template',
  icon: 'IconTemplate',
  relationTargetObjectMetadataUniversalIdentifier: EMAIL_TEMPLATE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGNS_ON_TEMPLATE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'templateId',
  },
});
