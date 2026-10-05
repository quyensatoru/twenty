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
  // No legacy equivalent: the legacy select predates them, and
  // legacyTriggerForEventName falls back to CUSTOM_EVENT for these, which is
  // exactly how a rollback release routes them (by eventName).
  {
    name: 'merchant.unsubscribed',
    label: 'Merchant unsubscribed',
    legacyTrigger: 'CUSTOM_EVENT',
  },
  {
    name: 'merchant.contact_changed',
    label: 'Contact changed',
    legacyTrigger: 'CUSTOM_EVENT',
  },
  {
    name: 'merchant.email_changed',
    label: 'Email changed',
    legacyTrigger: 'CUSTOM_EVENT',
  },
] as const satisfies readonly {
  name: string;
  label: string;
  legacyTrigger: MerchantTrigger;
}[];

export type BuiltInEventName = (typeof BUILT_IN_EVENT_NAMES)[number]['name'];
