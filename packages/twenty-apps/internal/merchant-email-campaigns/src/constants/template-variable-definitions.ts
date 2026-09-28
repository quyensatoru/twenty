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
  { key: 'shopifyPlan', label: 'Shopify plan', sample: 'BASIC' },
  { key: 'pricingPlan', label: 'Pricing plan', sample: 'FREE' },
  { key: 'country', label: 'Country', sample: 'US' },
  { key: 'unsubscribeUrl', label: 'Unsubscribe URL', sample: '#unsubscribe' },
  { key: 'currentYear', label: 'Current year', sample: '2026' },
];
