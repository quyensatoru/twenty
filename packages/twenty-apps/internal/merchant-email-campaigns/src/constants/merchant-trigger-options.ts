export const MERCHANT_TRIGGER_OPTIONS = [
  { value: 'INSTALLED', label: 'App installed', position: 0, color: 'green' },
  { value: 'UNINSTALLED', label: 'App uninstalled', position: 1, color: 'red' },
  {
    value: 'SHOPIFY_PLAN_CHANGED',
    label: 'Shopify plan changed',
    position: 2,
    color: 'blue',
  },
  {
    value: 'PRICING_PLAN_CHANGED',
    label: 'Pricing plan changed',
    position: 3,
    color: 'purple',
  },
  {
    value: 'CUSTOM_EVENT',
    label: 'Custom event (API)',
    position: 4,
    color: 'orange',
  },
] as const;
