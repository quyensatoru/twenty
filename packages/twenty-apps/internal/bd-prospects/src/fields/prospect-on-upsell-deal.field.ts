import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  PROSPECT_OBJECT_UID,
  PROSPECT_ON_UPSELL_DEAL_FIELD_UID,
  UPSELL_DEAL_OBJECT_UID,
  UPSELL_DEALS_ON_PROSPECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: PROSPECT_ON_UPSELL_DEAL_FIELD_UID,
  objectUniversalIdentifier: UPSELL_DEAL_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'prospect',
  label: 'Prospect',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier: PROSPECT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    UPSELL_DEALS_ON_PROSPECT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'prospectId',
  },
});
