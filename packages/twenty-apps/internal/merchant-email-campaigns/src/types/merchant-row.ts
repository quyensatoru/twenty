// Every column past `id` and `name` is optional on purpose: `using`,
// `shopifyPlan`, `pricingPlan`, `country` and `storeName` are custom fields of
// the workspace the MIDA/BLOY sync writes into, not part of the merchant
// standard object, so a bare workspace does not have them.
export type MerchantRow = {
  id: string;
  name?: string | null;
  appId?: string | null;
  app?: { name?: string | null } | null;
  using?: boolean | null;
  shopifyPlan?: string | null;
  pricingPlan?: string | null;
  country?: string | null;
  storeName?: string | null;
  contactName?: string | null;
  email?: { primaryEmail?: string | null } | null;
  emailUnsubscribed?: boolean | null;
};
