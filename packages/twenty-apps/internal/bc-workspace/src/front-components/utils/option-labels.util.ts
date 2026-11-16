import { t } from 'twenty-sdk/front-component';

import {
  ACTIVITY_TOPIC_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  MEETING_STATUS_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  SUBSCRIPTION_EVENT_TYPE_OPTIONS,
  TASK_CATEGORY_OPTIONS,
  TASK_OUTCOME_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_SOURCE_OPTIONS,
  TASK_STATUS_OPTIONS,
} from '../../constants/select-options';

type Option = { value: string; label: string; color: string };

const findOption = (
  options: readonly Option[],
  value: string | null | undefined,
): Option | undefined => options.find((option) => option.value === value);

// Option labels are English source strings shared with the field metadata;
// t() translates them through the app catalog.
export const readOptionLabel = (
  options: readonly Option[],
  value: string | null | undefined,
): string => {
  const option = findOption(options, value);

  return option === undefined ? (value ?? '') : t(option.label);
};

export const readOptionColor = (
  options: readonly Option[],
  value: string | null | undefined,
): string => findOption(options, value)?.color ?? 'gray';

export const toSelectOptions = (options: readonly Option[]) =>
  options.map((option) => ({ value: option.value, label: t(option.label) }));

export const OPTION_SETS = {
  relationshipStatus: RELATIONSHIP_STATUS_OPTIONS,
  issueStatus: ISSUE_STATUS_OPTIONS,
  taskCategory: TASK_CATEGORY_OPTIONS,
  taskStatus: TASK_STATUS_OPTIONS,
  taskPriority: TASK_PRIORITY_OPTIONS,
  taskSource: TASK_SOURCE_OPTIONS,
  taskOutcomeStatus: TASK_OUTCOME_STATUS_OPTIONS,
  activityType: ACTIVITY_TYPE_OPTIONS,
  activityTopic: ACTIVITY_TOPIC_OPTIONS,
  meetingStatus: MEETING_STATUS_OPTIONS,
  subscriptionEventType: SUBSCRIPTION_EVENT_TYPE_OPTIONS,
} as const;
