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

  // Opt-out is a deliberate human act, never a backfill: even a first-time
  // true must notify, so unlike plans there is no blank-before guard.
  if (before.emailUnsubscribed !== true && after.emailUnsubscribed === true) {
    eventNames.push('merchant.unsubscribed');
  }

  const beforeEmail = before.email?.primaryEmail?.trim() ?? '';
  const afterEmail = after.email?.primaryEmail?.trim() ?? '';

  if (
    beforeEmail !== '' &&
    afterEmail !== '' &&
    beforeEmail.toLowerCase() !== afterEmail.toLowerCase()
  ) {
    eventNames.push('merchant.email_changed');
  }

  if (
    !isBlank(before.contactName) &&
    before.contactName?.trim() !== after.contactName?.trim()
  ) {
    eventNames.push('merchant.contact_changed');
  }

  return eventNames;
};
