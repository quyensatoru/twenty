import {
  AUDIENCE_DATE_FIELD_OPTIONS,
  AUDIENCE_DATE_OPERATOR_OPTIONS,
  AUDIENCE_DATE_UNIT_OPTIONS,
} from '../constants/audience-date-options';
import { EMPTY_AUDIENCE_FILTER } from '../constants/empty-audience-filter';
import {
  type AudienceDateCondition,
  type AudienceFilter,
} from '../types/audience-filter';
import { readStringArray } from './read-string-array.util';
import { safeJsonParse } from './safe-json-parse.util';

const pickOption = <TValue extends string>(
  options: { value: TValue }[],
  value: unknown,
): TValue | undefined =>
  options.find((option) => option.value === value)?.value;

const readCalendarDate = (value: unknown): string | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().startsWith(value)
    ? value
    : null;
};

const readAmount = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : null;

const readDateConditions = (value: unknown): AudienceDateCondition[] =>
  Array.isArray(value)
    ? value.flatMap((item): AudienceDateCondition[] => {
        if (typeof item !== 'object' || item === null) {
          return [];
        }

        const record = item as Record<string, unknown>;
        const field = pickOption(AUDIENCE_DATE_FIELD_OPTIONS, record.field);
        const operator = pickOption(
          AUDIENCE_DATE_OPERATOR_OPTIONS,
          record.operator,
        );

        if (field === undefined || operator === undefined) {
          return [];
        }

        return [
          {
            field,
            operator,
            amount: readAmount(record.amount),
            unit: pickOption(AUDIENCE_DATE_UNIT_OPTIONS, record.unit) ?? 'DAY',
            date: readCalendarDate(record.date),
            endDate: readCalendarDate(record.endDate),
          },
        ];
      })
    : [];

export const parseAudienceFilter = (value: unknown): AudienceFilter => {
  const parsed = typeof value === 'string' ? safeJsonParse(value) : value;

  if (typeof parsed !== 'object' || parsed === null) {
    return EMPTY_AUDIENCE_FILTER;
  }

  const record = parsed as Record<string, unknown>;
  const installStatus =
    record.installStatus === 'INSTALLED' ||
    record.installStatus === 'UNINSTALLED'
      ? record.installStatus
      : 'ANY';

  return {
    appIds: readStringArray(record.appIds),
    installStatus,
    shopifyPlans: readStringArray(record.shopifyPlans),
    pricingPlans: readStringArray(record.pricingPlans),
    countries: readStringArray(record.countries),
    dateConditions: readDateConditions(record.dateConditions),
  };
};
