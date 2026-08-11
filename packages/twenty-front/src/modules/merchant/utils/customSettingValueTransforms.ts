import { isDefined } from 'twenty-shared/utils';

import {
  type CustomSettingFieldSchemaEntry,
  type CustomSettingFileValue,
  type CustomSettingToolRun,
  type CustomSettingValue,
} from '@/merchant/types/CustomSettingSchema';

export const ARRAY_VALUE_SEPARATOR = ',';

export const isCustomSettingFileValue = (
  value: unknown,
): value is CustomSettingFileValue =>
  isDefined(value) &&
  typeof value === 'object' &&
  'fileId' in (value as Record<string, unknown>);

export const isCustomSettingToolRun = (
  value: unknown,
): value is CustomSettingToolRun =>
  isDefined(value) &&
  typeof value === 'object' &&
  'runId' in (value as Record<string, unknown>) &&
  'status' in (value as Record<string, unknown>);

export const formatValueForInput = (
  entry: CustomSettingFieldSchemaEntry,
  existingValue: unknown,
): CustomSettingValue => {
  if (entry.type === 'BOOLEAN') {
    return Boolean(existingValue);
  }
  if (entry.type === 'ARRAY') {
    return Array.isArray(existingValue)
      ? existingValue.join(ARRAY_VALUE_SEPARATOR)
      : '';
  }
  if (entry.type === 'FILE') {
    return isCustomSettingFileValue(existingValue) ? existingValue : '';
  }
  return existingValue?.toString() ?? '';
};

export const parseValueForSave = (
  entry: CustomSettingFieldSchemaEntry,
  value: CustomSettingValue,
): unknown => {
  if (entry.type === 'NUMBER') {
    return Number(value) || 0;
  }
  if (entry.type === 'ARRAY') {
    return String(value)
      .split(ARRAY_VALUE_SEPARATOR)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (entry.type === 'FILE') {
    return isCustomSettingFileValue(value) ? value : undefined;
  }
  return value;
};

// A required tool input counts as filled only when it carries a usable value —
// BOOLEAN is exempt because unchecked is a legitimate answer.
export const hasCustomSettingValue = (
  entry: CustomSettingFieldSchemaEntry,
  value: CustomSettingValue | undefined,
): boolean => {
  if (entry.type === 'BOOLEAN') {
    return true;
  }
  if (entry.type === 'FILE') {
    return isCustomSettingFileValue(value);
  }
  return String(value ?? '').trim().length > 0;
};
