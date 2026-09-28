import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  WORKSPACE_MEMBER_WORKLOGS_FIELD_UID,
  WORKLOG_MEMBER_FIELD_UID,
  WORKLOG_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_WORKLOGS_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'worklogs',
  label: 'Worklogs',
  description: 'Worklogs logged by the workspace member',
  icon: 'IconClock',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: WORKLOG_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: WORKLOG_MEMBER_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
