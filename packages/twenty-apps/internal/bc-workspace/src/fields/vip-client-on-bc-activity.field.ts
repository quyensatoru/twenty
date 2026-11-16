import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  BC_ACTIVITY_OBJECT_UID,
  BC_ACTIVITY_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_ACTIVITIES_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: BC_ACTIVITY_VIP_CLIENT_FIELD_UID,
  objectUniversalIdentifier: BC_ACTIVITY_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'vipClient',
  label: 'VIP client',
  description: 'Client of the timeline entry',
  icon: 'IconCrown',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: VIP_CLIENT_ACTIVITIES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'vipClientId',
  },
});
