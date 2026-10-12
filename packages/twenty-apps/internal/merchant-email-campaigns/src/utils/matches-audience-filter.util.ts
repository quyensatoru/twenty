import {
  type AudienceDateCondition,
  type AudienceFilter,
} from '../types/audience-filter';
import { type MerchantRow } from '../types/merchant-row';
import { isMerchantInstalled } from './is-merchant-installed.util';
import { resolveAudienceDateCondition } from './resolve-audience-date-condition.util';

const matchesList = (list: string[], value: string | null | undefined) =>
  list.length === 0 ||
  (value !== null && value !== undefined && list.includes(value));

const matchesDateCondition = (
  merchant: MerchantRow,
  condition: AudienceDateCondition,
  now: Date,
): boolean => {
  const value = merchant[condition.field];
  const time =
    typeof value === 'string' && value !== ''
      ? new Date(value).getTime()
      : Number.NaN;
  const hasDate = !Number.isNaN(time);
  const resolved = resolveAudienceDateCondition(condition, now);

  switch (resolved.kind) {
    case 'EMPTY':
      return !hasDate;
    case 'NOT_EMPTY':
      return hasDate;
    case 'NO_MATCH':
      return false;
    case 'RANGE':
      return (
        hasDate &&
        (resolved.gte === null || time >= new Date(resolved.gte).getTime()) &&
        (resolved.lt === null || time < new Date(resolved.lt).getTime())
      );
  }
};

export const matchesAudienceFilter = (
  merchant: MerchantRow,
  filter: AudienceFilter,
  now: Date = new Date(),
): boolean => {
  if (filter.installStatus === 'INSTALLED' && !isMerchantInstalled(merchant)) {
    return false;
  }

  if (filter.installStatus === 'UNINSTALLED' && isMerchantInstalled(merchant)) {
    return false;
  }

  return (
    matchesList(filter.appIds, merchant.appId) &&
    matchesList(filter.shopifyPlans, merchant.shopifyPlan) &&
    matchesList(filter.pricingPlans, merchant.pricingPlan) &&
    matchesList(filter.countries, merchant.country) &&
    filter.dateConditions.every((condition) =>
      matchesDateCondition(merchant, condition, now),
    )
  );
};
