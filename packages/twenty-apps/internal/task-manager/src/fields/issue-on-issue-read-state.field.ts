import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_READ_STATE_OBJECT_UID,
  ISSUE_READ_STATE_ISSUE_FIELD_UID,
  ISSUE_ISSUE_READ_STATES_FIELD_UID,
} from '../constants/discussion';
import { ISSUE_OBJECT_UID } from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_READ_STATE_ISSUE_FIELD_UID,
  objectUniversalIdentifier: ISSUE_READ_STATE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issue',
  label: 'Issue',
  icon: 'IconMessage',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    ISSUE_ISSUE_READ_STATES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'issueId',
  },
});
