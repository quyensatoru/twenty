import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_CHILDREN_FIELD_UID,
  ISSUE_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_PARENT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_CHILDREN_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'children',
  label: 'Child issues',
  description: 'Child issues (stories or subtasks)',
  icon: 'IconSitemap',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_PARENT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
