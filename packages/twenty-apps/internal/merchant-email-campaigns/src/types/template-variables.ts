export type TemplateTextVariables = {
  shopDomain: string;
  storeName: string;
  contactName: string;
  email: string;
  appName: string;
  installStatus: string;
  shopifyPlan: string;
  pricingPlan: string;
  country: string;
  unsubscribeUrl: string;
  currentYear: string;
};

// ISO timestamps read by daysSince / daysUntil / date. `installedAt` already
// falls back to the CRM creation date while the sync does not fill it.
export type TemplateDates = {
  installedAt: string | null;
  uninstalledAt: string | null;
  addedToCrmAt: string | null;
};

export type TemplateVariables = TemplateTextVariables & {
  // Properties of the inbound event that fired a custom-event automation,
  // read in templates as {{event.<key>}}.
  eventProperties?: Record<string, string>;
  dates?: TemplateDates;
  // Send time as ISO; the clock is used when it is missing.
  now?: string;
  // Converting blocks to HTML keeps every {{...}} token and condition as
  // written instead of evaluating it.
  preserveTokens?: boolean;
};
