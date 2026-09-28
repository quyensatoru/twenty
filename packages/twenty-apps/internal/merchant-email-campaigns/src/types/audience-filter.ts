export type InstallStatusFilter = 'ANY' | 'INSTALLED' | 'UNINSTALLED';

export type AudienceFilter = {
  appIds: string[];
  installStatus: InstallStatusFilter;
  shopifyPlans: string[];
  pricingPlans: string[];
  countries: string[];
};
