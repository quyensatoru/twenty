import { type AudienceFilter } from '../types/audience-filter';

// Server-side twin of matchesAudienceFilter: the broadcast pages through the
// merchants table with this, the automation checks one record in memory.
export const buildMerchantGraphqlFilter = (
  filter: AudienceFilter,
): Record<string, unknown> => {
  const conditions: Record<string, unknown>[] = [
    { email: { primaryEmail: { neq: '' } } },
    { not: { emailUnsubscribed: { eq: true } } },
  ];

  if (filter.appIds.length > 0) {
    conditions.push({ appId: { in: filter.appIds } });
  }

  if (filter.installStatus === 'INSTALLED') {
    conditions.push({
      or: [{ using: { eq: true } }, { using: { is: 'NULL' } }],
    });
  }

  if (filter.installStatus === 'UNINSTALLED') {
    conditions.push({ using: { eq: false } });
  }

  if (filter.shopifyPlans.length > 0) {
    conditions.push({ shopifyPlan: { in: filter.shopifyPlans } });
  }

  if (filter.pricingPlans.length > 0) {
    conditions.push({ pricingPlan: { in: filter.pricingPlans } });
  }

  if (filter.countries.length > 0) {
    conditions.push({ country: { in: filter.countries } });
  }

  return { and: conditions };
};
