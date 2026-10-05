import { type TemplateVariables } from '../types/template-variables';

export const TEMPLATE_VARIABLE_DEFINITIONS: {
  key: Exclude<keyof TemplateVariables, 'eventProperties'>;
  label: string;
  sample: string;
}[] = [
  {
    key: 'shopDomain',
    label: 'Shop domain',
    sample: 'demo-store.myshopify.com',
  },
  { key: 'storeName', label: 'Store name', sample: 'Demo Store' },
  { key: 'contactName', label: 'Contact name', sample: 'Alex' },
  { key: 'email', label: 'Email', sample: 'owner@demo-store.com' },
  { key: 'appName', label: 'App name', sample: 'MIDA' },
  {
    key: 'installStatus',
    label: 'Install status',
    sample: 'installed',
  },
  { key: 'shopifyPlan', label: 'Shopify plan', sample: 'BASIC' },
  { key: 'pricingPlan', label: 'Pricing plan', sample: 'FREE' },
  { key: 'country', label: 'Country', sample: 'US' },
  { key: 'unsubscribeUrl', label: 'Unsubscribe URL', sample: '#unsubscribe' },
  { key: 'currentYear', label: 'Current year', sample: '2026' },
];

// Old/new values a merchant.* automation carries about what changed. Only
// filled when both sides exist; the chip inserts the full {{event.*}} token
// the interpolator reads from eventProperties.
export const TEMPLATE_EVENT_PROPERTY_DEFINITIONS: {
  key: string;
  label: string;
  sample: string;
}[] = [
  { key: 'event.oldShopifyPlan', label: 'Old Shopify plan', sample: 'BASIC' },
  { key: 'event.newShopifyPlan', label: 'New Shopify plan', sample: 'PLUS' },
  { key: 'event.oldPricingPlan', label: 'Old pricing plan', sample: 'FREE' },
  {
    key: 'event.newPricingPlan',
    label: 'New pricing plan',
    sample: 'SS_GROWTH',
  },
  {
    key: 'event.oldContactName',
    label: 'Old contact name',
    sample: 'Alex',
  },
  {
    key: 'event.newContactName',
    label: 'New contact name',
    sample: 'Sam',
  },
  {
    key: 'event.oldEmail',
    label: 'Old email',
    sample: 'old@demo-store.com',
  },
  {
    key: 'event.newEmail',
    label: 'New email',
    sample: 'new@demo-store.com',
  },
];
