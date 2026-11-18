export const VIP_SHOPIFY_PLANS = ['ADVANCED', 'PLUS', 'SHOPIFY_PLUS'];

export const VIP_APP_PLANS: Record<string, string[]> = {
  FRAUD: ['FR_UNLIMITED', 'FR_PLUS'],
  MIDA: ['SS_ENTERPRISE'],
  BLOY: ['GROWTH', 'PLUS', 'ENTERPRISE'],
};

export const VIP_PRICING_PLANS = [...new Set(Object.values(VIP_APP_PLANS).flat())];

const TEST_SHOPIFY_PLANS = [
  'DEVELOPMENT',
  'PARTNER_TEST',
  'DEVELOPER_PREVIEW',
  'STAFF',
  'STAFF_BUSINESS',
  'STAFF BUSINESS',
];

export type VipEligibilityMerchant = {
  name: string | null;
  storeName: string | null;
  using: boolean | null;
  pricingPlan: string | null;
  shopifyPlan: string | null;
  appName: string | null;
};

export type VipCandidate = {
  shopDomain: string;
  name: string;
};

const isTestShopifyPlan = (shopifyPlan: string | null): boolean =>
  shopifyPlan !== null &&
  (TEST_SHOPIFY_PLANS.includes(shopifyPlan) ||
    shopifyPlan.endsWith('APP_DEVELOPMENT') ||
    shopifyPlan.endsWith('PLUS_DEVELOPMENT') ||
    shopifyPlan.endsWith('SANDBOX'));

const qualifies = (merchant: VipEligibilityMerchant): boolean =>
  (merchant.shopifyPlan !== null && VIP_SHOPIFY_PLANS.includes(merchant.shopifyPlan)) ||
  (merchant.appName !== null &&
    merchant.pricingPlan !== null &&
    (VIP_APP_PLANS[merchant.appName] ?? []).includes(merchant.pricingPlan));

// A shop is VIP when any live install qualifies; any live install on a dev or
// test store disqualifies the whole shop.
export const selectVipCandidates = (
  merchants: VipEligibilityMerchant[],
): VipCandidate[] => {
  const byShop = new Map<string, VipEligibilityMerchant[]>();

  for (const merchant of merchants) {
    const shopDomain = merchant.name?.trim().toLowerCase();

    if (!shopDomain || merchant.using !== true) {
      continue;
    }

    byShop.set(shopDomain, [...(byShop.get(shopDomain) ?? []), merchant]);
  }

  return [...byShop.entries()]
    .filter(
      ([, shopMerchants]) =>
        shopMerchants.some(qualifies) &&
        !shopMerchants.some((merchant) => isTestShopifyPlan(merchant.shopifyPlan)),
    )
    .map(([shopDomain, shopMerchants]) => ({
      shopDomain,
      name:
        shopMerchants.map((merchant) => merchant.storeName?.trim()).find(Boolean) ??
        shopDomain,
    }));
};
