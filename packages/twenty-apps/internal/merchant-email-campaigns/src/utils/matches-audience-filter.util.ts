import { type AudienceFilter } from '../types/audience-filter';
import { type MerchantRow } from '../types/merchant-row';
import { isMerchantInstalled } from './is-merchant-installed.util';

const matchesList = (list: string[], value: string | null | undefined) =>
  list.length === 0 ||
  (value !== null && value !== undefined && list.includes(value));

export const matchesAudienceFilter = (
  merchant: MerchantRow,
  filter: AudienceFilter,
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
    matchesList(filter.countries, merchant.country)
  );
};
