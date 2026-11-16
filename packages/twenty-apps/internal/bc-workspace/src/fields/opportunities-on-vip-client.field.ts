import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_OPPORTUNITY_OBJECT_UID,
  BC_OPPORTUNITY_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_OPPORTUNITIES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: VIP_CLIENT_OPPORTUNITIES_FIELD_UID,
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'opportunities',
  label: 'Upsell opportunities',
  description: 'Upsell opportunities of the client',
  icon: 'IconTargetArrow',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_OPPORTUNITY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_OPPORTUNITY_VIP_CLIENT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
