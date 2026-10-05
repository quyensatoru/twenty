import { type MerchantRow } from '../types/merchant-row';

// Values a merchant.* automation can use as {{event.<key>}}: what changed,
// old and new. Only set keys both sides can fill, so a template never prints
// "undefined".
export const buildMerchantChangeProperties = ({
  before,
  after,
}: {
  before?: MerchantRow;
  after: MerchantRow;
}): Record<string, string> => {
  const properties: Record<string, string> = {};

  const assignIfBoth = (key: string, oldValue: unknown, newValue: unknown) => {
    if (typeof oldValue === 'string' && typeof newValue === 'string') {
      properties[`old${key}`] = oldValue;
      properties[`new${key}`] = newValue;
    }
  };

  if (before === undefined) {
    return properties;
  }

  assignIfBoth(
    'ShopifyPlan',
    before.shopifyPlan?.trim(),
    after.shopifyPlan?.trim(),
  );
  assignIfBoth(
    'PricingPlan',
    before.pricingPlan?.trim(),
    after.pricingPlan?.trim(),
  );
  assignIfBoth(
    'ContactName',
    before.contactName?.trim(),
    after.contactName?.trim(),
  );
  assignIfBoth(
    'Email',
    before.email?.primaryEmail?.trim(),
    after.email?.primaryEmail?.trim(),
  );

  return properties;
};
