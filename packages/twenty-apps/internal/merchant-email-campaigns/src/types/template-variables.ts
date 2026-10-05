export type TemplateVariables = {
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
  // Properties of the inbound event that fired a custom-event automation,
  // read in templates as {{event.<key>}}.
  eventProperties?: Record<string, string>;
};
