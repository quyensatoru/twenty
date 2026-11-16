import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_ISSUE_OBJECT_UID,
  BC_ISSUE_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_ISSUES_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: VIP_CLIENT_ISSUES_FIELD_UID,
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issues',
  label: 'Issues',
  description: 'Problems reported by the client',
  icon: 'IconAlertTriangle',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_ISSUE_VIP_CLIENT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
