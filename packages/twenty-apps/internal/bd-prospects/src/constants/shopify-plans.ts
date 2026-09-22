export const SHOPIFY_PLAN_OPTIONS = [
  {
    id: '898a99d3-d28e-4dc7-8ae6-2bf269411fa0',
    value: 'PLUS',
    label: 'Plus',
    position: 0,
    color: 'purple',
  },
  {
    id: '485f4425-ff26-4b48-9c70-b9db6fadbdf0',
    value: 'ADVANCED',
    label: 'Advanced',
    position: 1,
    color: 'blue',
  },
  {
    id: '4fb56d24-8313-4840-8431-9f17b234aaf8',
    value: 'SHOPIFY',
    label: 'Shopify',
    position: 2,
    color: 'gray',
  },
  {
    id: '7c1b1856-a493-49d5-8ca3-f5177a0e11a2',
    value: 'BASIC',
    label: 'Basic',
    position: 3,
    color: 'gray',
  },
  {
    id: '18eb8ad0-a51c-46ad-91ff-465240ea7034',
    value: 'OTHER',
    label: 'Other',
    position: 4,
    color: 'gray',
  },
] as const;

// The two plans the BD area is scoped to, in the vocabulary the prospect stores.
export const HIGH_VALUE_SHOPIFY_PLANS = ['ADVANCED', 'PLUS'];

// Apps do not agree on how to spell a plan on the merchant row. MIDA and FRAUD
// write the normalised name, BLOY writes Shopify's own handle: UNLIMITED is
// Advanced, SHOPIFY_PLUS is Plus, PROFESSIONAL and GROW are the middle tier.
// Reading the raw value is why BLOY's 294 Advanced/Plus shops were invisible.
export const MERCHANT_PLAN_ALIASES: Record<string, string> = {
  PLUS: 'PLUS',
  SHOPIFY_PLUS: 'PLUS',
  ADVANCED: 'ADVANCED',
  UNLIMITED: 'ADVANCED',
  SHOPIFY: 'SHOPIFY',
  PROFESSIONAL: 'SHOPIFY',
  GROW: 'SHOPIFY',
  BASIC: 'BASIC',
  STARTER: 'BASIC',
};

// Values that describe the install, not the plan: BLOY parks `BLOY_UNINSTALLED`
// in the plan column when a shop removes the app. Treating them as a plan would
// overwrite the last known one, so they are read as "no information" and the
// stored plan is kept.
export const MERCHANT_NON_PLAN_VALUES = [
  'BLOY_UNINSTALLED',
  'UNINSTALLED',
  'INACTIVE',
  'CANCELLED',
  'DORMANT',
  'FROZEN',
  'TRIAL',
  'PAUSED',
  'PARTNER_TEST',
  'AFFILIATE',
  'STAFF',
  'DEVELOPMENT',
  'NONE',
];
