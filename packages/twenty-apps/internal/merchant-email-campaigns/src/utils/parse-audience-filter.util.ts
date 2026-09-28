import { type AudienceFilter } from '../types/audience-filter';
import { EMPTY_AUDIENCE_FILTER } from '../constants/empty-audience-filter';
import { readStringArray } from './read-string-array.util';
import { safeJsonParse } from './safe-json-parse.util';

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
  };
};
