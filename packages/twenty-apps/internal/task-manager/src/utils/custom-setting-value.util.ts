import {
  type CustomSettingDraftValue,
  type CustomSettingFieldSchemaEntry,
  type CustomSettingValues,
  isCustomSettingFileValue,
} from '../types/custom-setting-schema';

export const ARRAY_VALUE_SEPARATOR = ',';

const DATE_INPUT_LENGTH = 'YYYY-MM-DD'.length;

// What the stored value looks like in an input. An absent value falls back to
// the schema's `default`, so a merchant that has never been edited opens on
// the app's intended settings rather than on blanks.
export const formatCustomSettingValue = (
  entry: CustomSettingFieldSchemaEntry,
  storedValue: unknown,
): CustomSettingDraftValue => {
  const value = storedValue === undefined ? entry.default : storedValue;

  if (entry.type === 'BOOLEAN') {
    return value === true || value === 'true';
  }

  // The reference travels as itself: a FILE value is an object, and a round
  // trip through String() would store the text "[object Object]" over it.
  if (entry.type === 'FILE') {
    return isCustomSettingFileValue(value) ? value : '';
  }

  if (entry.type === 'ARRAY') {
    return Array.isArray(value)
      ? value.join(ARRAY_VALUE_SEPARATOR)
      : (value?.toString() ?? '');
  }

  const text = value?.toString() ?? '';

  // A `date` input only accepts YYYY-MM-DD and silently shows nothing for
  // anything longer, so a value stored as a full ISO timestamp is trimmed to
  // the day it names.
  return entry.type === 'DATE' ? text.slice(0, DATE_INPUT_LENGTH) : text;
};

export const parseCustomSettingValue = (
  entry: CustomSettingFieldSchemaEntry,
  draftValue: CustomSettingDraftValue,
): unknown => {
  if (entry.type === 'BOOLEAN') {
    return draftValue === true;
  }

  if (entry.type === 'FILE') {
    return isCustomSettingFileValue(draftValue) ? draftValue : undefined;
  }

  if (entry.type === 'NUMBER') {
    const parsed = Number(draftValue);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (entry.type === 'ARRAY') {
    return String(draftValue)
      .split(ARRAY_VALUE_SEPARATOR)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return draftValue;
};

// Unchecked is a legitimate answer, so a required BOOLEAN is always satisfied.
export const hasCustomSettingValue = (
  entry: CustomSettingFieldSchemaEntry,
  draftValue: CustomSettingDraftValue | undefined,
): boolean => {
  if (entry.type === 'BOOLEAN') {
    return true;
  }

  if (entry.type === 'FILE') {
    return isCustomSettingFileValue(draftValue);
  }

  return String(draftValue ?? '').trim().length > 0;
};

export const listMissingRequiredLabels = (
  entries: readonly CustomSettingFieldSchemaEntry[],
  draftValues: Record<string, CustomSettingDraftValue>,
): string[] =>
  entries
    .filter(
      (entry) =>
        entry.required === true &&
        !hasCustomSettingValue(entry, draftValues[entry.key]),
    )
    .map((entry) => entry.label);

export const buildCustomSettingDraft = (
  entries: readonly CustomSettingFieldSchemaEntry[],
  storedValues: CustomSettingValues,
): Record<string, CustomSettingDraftValue> =>
  Object.fromEntries(
    entries.map((entry) => [
      entry.key,
      formatCustomSettingValue(entry, storedValues[entry.key]),
    ]),
  );

// Only the keys the schema declares as FIELDS are rewritten. Everything else
// the merchant carries — a tool's run envelope, a key written by something
// that is not this form — is left exactly as it was.
export const mergeCustomSettingValues = ({
  entries,
  storedValues,
  draftValues,
}: {
  entries: readonly CustomSettingFieldSchemaEntry[];
  storedValues: CustomSettingValues;
  draftValues: Record<string, CustomSettingDraftValue>;
}): CustomSettingValues => {
  const mergedValues: CustomSettingValues = { ...storedValues };

  for (const entry of entries) {
    const draftValue =
      draftValues[entry.key] ?? formatCustomSettingValue(entry, undefined);

    // A FILE is the one type whose absence is meaningful: the draft either
    // carries a reference or the user removed the one that was there. Writing
    // the empty draft as a value would store the string "" over a reference.
    if (entry.type === 'FILE') {
      if (isCustomSettingFileValue(draftValue)) {
        mergedValues[entry.key] = draftValue;
      } else {
        delete mergedValues[entry.key];
      }

      continue;
    }

    mergedValues[entry.key] = parseCustomSettingValue(entry, draftValue);
  }

  return mergedValues;
};

// A tool field's value becomes a run's `params`, never a record write — so a
// FILE missing a reference is dropped rather than parsed into "undefined".
export const buildToolRunParams = (
  fields: readonly CustomSettingFieldSchemaEntry[],
  draftValues: Record<string, CustomSettingDraftValue>,
): Record<string, unknown> => {
  const params: Record<string, unknown> = {};

  for (const field of fields) {
    const draftValue =
      draftValues[field.key] ?? formatCustomSettingValue(field, undefined);

    if (field.type === 'FILE') {
      if (isCustomSettingFileValue(draftValue)) {
        params[field.key] = draftValue;
      }

      continue;
    }

    params[field.key] = parseCustomSettingValue(field, draftValue);
  }

  return params;
};
