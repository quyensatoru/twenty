import { type MerchantRow } from '../types/merchant-row';
import { type MerchantTrigger } from '../types/merchant-trigger';
import { isMerchantInstalled } from './is-merchant-installed.util';

const isBlank = (value: string | null | undefined) =>
  value === null || value === undefined || value.trim() === '';

// `before` is undefined for a created row. A plan going from empty to a value
// is the sync filling the column for the first time, not a plan change, so it
// is ignored: otherwise a backfill would mail every merchant at once.
export const detectMerchantTriggers = ({
  before,
  after,
}: {
  before?: MerchantRow;
  after: MerchantRow;
}): MerchantTrigger[] => {
  if (before === undefined) {
    return isMerchantInstalled(after) ? ['INSTALLED'] : [];
  }

  const triggers: MerchantTrigger[] = [];
  const wasInstalled = isMerchantInstalled(before);
  const isInstalled = isMerchantInstalled(after);

  if (!wasInstalled && isInstalled) {
    triggers.push('INSTALLED');
  }

  if (wasInstalled && !isInstalled) {
    triggers.push('UNINSTALLED');
  }

  if (
    !isBlank(before.shopifyPlan) &&
    before.shopifyPlan !== after.shopifyPlan
  ) {
    triggers.push('SHOPIFY_PLAN_CHANGED');
  }

  if (
    !isBlank(before.pricingPlan) &&
    before.pricingPlan !== after.pricingPlan
  ) {
    triggers.push('PRICING_PLAN_CHANGED');
  }

  return triggers;
};
