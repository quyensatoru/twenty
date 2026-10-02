import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_HISTORIES_FIELD_UID,
  ISSUE_HISTORY_ISSUE_FIELD_UID,
  ISSUE_HISTORY_OBJECT_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_HISTORIES_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'histories',
  label: 'Histories',
  description: "Issue's history entries",
  icon: 'IconHistory',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_HISTORY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_HISTORY_ISSUE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
