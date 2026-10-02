import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_ISSUE_HISTORIES_FIELD_UID,
  APP_OBJECT_UID,
  ISSUE_HISTORY_APP_FIELD_UID,
  ISSUE_HISTORY_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_ISSUE_HISTORIES_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'histories',
  label: 'Histories',
  description: 'Issue history entries belonging to this app',
  icon: 'IconHistory',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_HISTORY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: ISSUE_HISTORY_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
