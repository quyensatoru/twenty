import { defineObject } from 'twenty-sdk/define';

import {
  TASK_CATEGORY_OPTIONS,
  TASK_OUTCOME_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_SOURCE_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TRIGGER_TYPE_OPTIONS,
} from '../constants/select-options';
import {
  BC_TASK_APP_NAME_FIELD_UID,
  BC_TASK_CATEGORY_FIELD_UID,
  BC_TASK_COMPLETED_AT_FIELD_UID,
  BC_TASK_CUSTOM_CATEGORY_FIELD_UID,
  BC_TASK_HISTORY_FIELD_UID,
  BC_TASK_NOTES_FIELD_UID,
  BC_TASK_OBJECT_UID,
  BC_TASK_OUTCOME_FIELD_UID,
  BC_TASK_OUTCOME_STATUS_FIELD_UID,
  BC_TASK_PRIORITY_FIELD_UID,
  BC_TASK_SOURCE_FIELD_UID,
  BC_TASK_STATUS_FIELD_UID,
  BC_TASK_TITLE_FIELD_UID,
  BC_TASK_TRIGGER_KEY_FIELD_UID,
  BC_TASK_TRIGGER_TYPE_FIELD_UID,
} from '../constants/universal-identifiers';
import {
  dateTimeField,
  rawJsonField,
  selectField,
  textField,
} from '../utils/field-builders.util';

// A BC's own follow-up work. No due date by design: tasks are ordered by
// priority and creation, never escalated by age.
export default defineObject({
  universalIdentifier: BC_TASK_OBJECT_UID,
  nameSingular: 'bcTask',
  namePlural: 'bcTasks',
  labelSingular: 'BC Task',
  labelPlural: 'BC Tasks',
  description: 'A personal task of a Business Consultant',
  icon: 'IconCheckbox',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: BC_TASK_TITLE_FIELD_UID,
  fields: [
    textField({
      universalIdentifier: BC_TASK_TITLE_FIELD_UID,
      name: 'title',
      label: 'Title',
      icon: 'IconCheckbox',
      isSearchable: true,
    }),
    textField({
      universalIdentifier: BC_TASK_NOTES_FIELD_UID,
      name: 'notes',
      label: 'Notes',
      icon: 'IconNotes',
    }),
    selectField({
      universalIdentifier: BC_TASK_CATEGORY_FIELD_UID,
      name: 'category',
      label: 'Category',
      icon: 'IconTag',
      options: TASK_CATEGORY_OPTIONS,
      defaultValue: 'FOLLOW_UP',
    }),
    textField({
      universalIdentifier: BC_TASK_CUSTOM_CATEGORY_FIELD_UID,
      name: 'customCategory',
      label: 'Custom category',
      description: 'Required label when the category is Other',
      icon: 'IconTag',
    }),
    selectField({
      universalIdentifier: BC_TASK_STATUS_FIELD_UID,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      options: TASK_STATUS_OPTIONS,
      defaultValue: 'TODO',
    }),
    selectField({
      universalIdentifier: BC_TASK_PRIORITY_FIELD_UID,
      name: 'priority',
      label: 'Priority',
      icon: 'IconFlag',
      options: TASK_PRIORITY_OPTIONS,
      defaultValue: 'MEDIUM',
    }),
    selectField({
      universalIdentifier: BC_TASK_SOURCE_FIELD_UID,
      name: 'source',
      label: 'Source',
      icon: 'IconBolt',
      options: TASK_SOURCE_OPTIONS,
      defaultValue: 'MANUAL',
    }),
    selectField({
      universalIdentifier: BC_TASK_TRIGGER_TYPE_FIELD_UID,
      name: 'triggerType',
      label: 'Trigger',
      icon: 'IconBolt',
      options: TASK_TRIGGER_TYPE_OPTIONS,
    }),
    {
      ...textField({
        universalIdentifier: BC_TASK_TRIGGER_KEY_FIELD_UID,
        name: 'triggerKey',
        label: 'Trigger key',
        description:
          'Deduplication key of an automatic task, e.g. usage:<client>:BLOY:<plan>:<cycle>',
        icon: 'IconKey',
      }),
      isUnique: true,
    },
    textField({
      universalIdentifier: BC_TASK_OUTCOME_FIELD_UID,
      name: 'outcome',
      label: 'Outcome',
      icon: 'IconTargetArrow',
    }),
    selectField({
      universalIdentifier: BC_TASK_OUTCOME_STATUS_FIELD_UID,
      name: 'outcomeStatus',
      label: 'Upsell outcome',
      description: 'A Converted label alone is not a verified upgrade',
      icon: 'IconTargetArrow',
      options: TASK_OUTCOME_STATUS_OPTIONS,
    }),
    dateTimeField({
      universalIdentifier: BC_TASK_COMPLETED_AT_FIELD_UID,
      name: 'completedAt',
      label: 'Completed at',
      icon: 'IconCircleCheck',
    }),
    textField({
      universalIdentifier: BC_TASK_APP_NAME_FIELD_UID,
      name: 'appName',
      label: 'App',
      icon: 'IconApps',
    }),
    rawJsonField({
      universalIdentifier: BC_TASK_HISTORY_FIELD_UID,
      name: 'history',
      label: 'History',
      description: 'Audit trail: [{ at, actorMemberId, action, from, to, note }]',
      icon: 'IconHistory',
    }),
  ],
});
