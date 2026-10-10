import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  DEVELOPMENT_DELIVERY_ISSUE_FIELD_UID,
  DEVELOPMENT_DELIVERY_OBJECT_UID,
  ISSUE_DEVELOPMENT_DELIVERIES_FIELD_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: DEVELOPMENT_DELIVERY_ISSUE_FIELD_UID,
  objectUniversalIdentifier: DEVELOPMENT_DELIVERY_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issue',
  label: 'Issue',
  description: 'Issue this development link belongs to',
  icon: 'IconLayoutKanban',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    ISSUE_DEVELOPMENT_DELIVERIES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'issueId',
  },
});
