import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  TASK_PERSONAL_BOARD_OBJECT_UID,
  TASK_PERSONAL_BOARD_NAME_FIELD_UID,
  TASK_PERSONAL_BOARD_MEMBER_FIELD_UID,
  TASK_PERSONAL_BOARD_ISSUE_FIELD_UID,
  TASK_PERSONAL_BOARD_CONFIGURATION_FIELD_UID,
} from '../constants/task-personal-board';

export default defineObject({
  universalIdentifier: TASK_PERSONAL_BOARD_OBJECT_UID,
  nameSingular: 'taskPersonalBoardState',
  namePlural: 'taskPersonalBoardStates',
  labelSingular: 'Personal Board State',
  labelPlural: 'Personal Board States',
  description: 'Member-specific planning and board preferences.',
  icon: 'IconLayoutKanban',
  labelIdentifierFieldMetadataUniversalIdentifier:
    TASK_PERSONAL_BOARD_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: TASK_PERSONAL_BOARD_NAME_FIELD_UID,
      name: 'name',
      label: 'Name',
      type: FieldType.TEXT,
      icon: 'IconLayoutKanban',
      isNullable: true,
    },
    {
      universalIdentifier: TASK_PERSONAL_BOARD_MEMBER_FIELD_UID,
      name: 'memberId',
      label: 'Member Id',
      type: FieldType.TEXT,
      icon: 'IconUser',
      isNullable: true,
    },
    {
      universalIdentifier: TASK_PERSONAL_BOARD_ISSUE_FIELD_UID,
      name: 'issueId',
      label: 'Issue Id',
      type: FieldType.TEXT,
      icon: 'IconCheckbox',
      isNullable: true,
    },
    {
      universalIdentifier: TASK_PERSONAL_BOARD_CONFIGURATION_FIELD_UID,
      name: 'configuration',
      label: 'Configuration',
      type: FieldType.RAW_JSON,
      icon: 'IconSettings',
      isNullable: true,
    },
  ],
});
