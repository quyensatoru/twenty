import { type MerchantTrigger } from '../types/merchant-trigger';

// This app watches the merchant table itself, so these four names are emitted
// in-process instead of being posted to the events API. They share the one
// event namespace with everything senders post, under a reserved `merchant.`
// prefix: an app posting a generic `installed` must not fire the install
// automations meant for a real Shopify install.
export const BUILT_IN_EVENT_NAMES = [
  {
    name: 'merchant.installed',
    label: 'App installed',
    legacyTrigger: 'INSTALLED',
  },
  {
    name: 'merchant.uninstalled',
    label: 'App uninstalled',
    legacyTrigger: 'UNINSTALLED',
  },
  {
    name: 'merchant.shopify_plan_changed',
    label: 'Shopify plan changed',
    legacyTrigger: 'SHOPIFY_PLAN_CHANGED',
  },
  {
    name: 'merchant.pricing_plan_changed',
    label: 'Pricing plan changed',
    legacyTrigger: 'PRICING_PLAN_CHANGED',
  },
] as const satisfies readonly {
  name: string;
  label: string;
  legacyTrigger: MerchantTrigger;
}[];

export type BuiltInEventName = (typeof BUILT_IN_EVENT_NAMES)[number]['name'];
