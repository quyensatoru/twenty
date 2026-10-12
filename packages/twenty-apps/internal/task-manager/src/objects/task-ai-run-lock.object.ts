import { defineObject, FieldType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  TASK_AI_RUN_LOCK_OBJECT_UID,
  TASK_AI_RUN_LOCK_MEMBER_ID_FIELD_UID,
  TASK_AI_RUN_LOCK_OWNER_TOKEN_FIELD_UID,
  TASK_AI_RUN_LOCK_LEASE_UNTIL_FIELD_UID,
} from '../constants/task-ai-run-lock';

export default defineObject({
  universalIdentifier: TASK_AI_RUN_LOCK_OBJECT_UID,
  nameSingular: 'taskAiRunLock',
  namePlural: 'taskAiRunLocks',
  labelSingular: 'Task AI Run Lock',
  labelPlural: 'Task AI Run Locks',
  description:
    'Private per-member lease preventing concurrent Task AI replies.',
  icon: 'IconSparkles',
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: TASK_AI_RUN_LOCK_OBJECT_UID,
      name: 'id',
    }),
  fields: [
    {
      universalIdentifier: TASK_AI_RUN_LOCK_MEMBER_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'memberId',
      label: 'Member Id',
      isNullable: true,
      icon: 'IconUser',
    },
    {
      universalIdentifier: TASK_AI_RUN_LOCK_OWNER_TOKEN_FIELD_UID,
      type: FieldType.TEXT,
      name: 'ownerToken',
      label: 'Owner Token',
      isNullable: true,
      icon: 'IconSparkles',
    },
    {
      universalIdentifier: TASK_AI_RUN_LOCK_LEASE_UNTIL_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'leaseUntil',
      label: 'Lease Until',
      isNullable: true,
      icon: 'IconClock',
    },
  ],
});
