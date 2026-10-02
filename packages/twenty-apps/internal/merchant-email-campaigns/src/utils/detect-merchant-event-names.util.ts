import { type MerchantRow } from '../types/merchant-row';
import { isMerchantInstalled } from './is-merchant-installed.util';

const isBlank = (value: string | null | undefined) =>
  value === null || value === undefined || value.trim() === '';

// `before` is undefined for a created row. A plan going from empty to a value
// is the sync filling the column for the first time, not a plan change, so it
// is ignored: otherwise a backfill would mail every merchant at once.
export const detectMerchantEventNames = ({
  before,
  after,
}: {
  before?: MerchantRow;
  after: MerchantRow;
}): string[] => {
  if (before === undefined) {
    return isMerchantInstalled(after) ? ['merchant.installed'] : [];
  }

  const eventNames: string[] = [];
  const wasInstalled = isMerchantInstalled(before);
  const isInstalled = isMerchantInstalled(after);

  if (!wasInstalled && isInstalled) {
    eventNames.push('merchant.installed');
  }

  if (wasInstalled && !isInstalled) {
    eventNames.push('merchant.uninstalled');
  }

  if (
    !isBlank(before.shopifyPlan) &&
    before.shopifyPlan !== after.shopifyPlan
  ) {
    eventNames.push('merchant.shopify_plan_changed');
  }

  if (
    !isBlank(before.pricingPlan) &&
    before.pricingPlan !== after.pricingPlan
  ) {
    eventNames.push('merchant.pricing_plan_changed');
  }

  return eventNames;
};
