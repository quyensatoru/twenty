import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  TASK_AI_RUN_LOCK_OBJECT_UID,
  TASK_AI_RUN_LOCK_ISSUE_FIELD_UID,
  ISSUE_TASK_AI_RUN_LOCKS_FIELD_UID,
} from '../constants/task-ai-run-lock';
import { ISSUE_OBJECT_UID } from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_TASK_AI_RUN_LOCKS_FIELD_UID,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'taskAiRunLocks',
  label: 'Task AI Run Locks',
  icon: 'IconSparkles',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: TASK_AI_RUN_LOCK_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    TASK_AI_RUN_LOCK_ISSUE_FIELD_UID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
