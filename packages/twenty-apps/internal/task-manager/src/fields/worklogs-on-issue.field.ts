import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_WORKLOGS_FIELD_UID,
  ISSUE_OBJECT_UID,
  WORKLOG_OBJECT_UID,
  WORKLOG_ISSUE_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_WORKLOGS_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'worklogs',
  label: 'Worklogs',
  description: 'Issue's worklogs',
  icon: 'IconClock',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: WORKLOG_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: WORKLOG_ISSUE_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
