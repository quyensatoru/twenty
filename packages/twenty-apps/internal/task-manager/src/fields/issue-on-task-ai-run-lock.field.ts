import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  TASK_AI_RUN_LOCK_OBJECT_UID,
  TASK_AI_RUN_LOCK_ISSUE_FIELD_UID,
  ISSUE_TASK_AI_RUN_LOCKS_FIELD_UID,
} from '../constants/task-ai-run-lock';
import { ISSUE_OBJECT_UID } from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: TASK_AI_RUN_LOCK_ISSUE_FIELD_UID,
  objectUniversalIdentifier: TASK_AI_RUN_LOCK_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issue',
  label: 'Issue',
  icon: 'IconCheckbox',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    ISSUE_TASK_AI_RUN_LOCKS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'issueId',
  },
});
