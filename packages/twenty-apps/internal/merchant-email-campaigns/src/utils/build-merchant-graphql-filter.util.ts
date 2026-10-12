import { type AudienceFilter } from '../types/audience-filter';
import { resolveAudienceDateCondition } from './resolve-audience-date-condition.util';

// Server-side twin of matchesAudienceFilter: the broadcast pages through the
// merchants table with this, the automation checks one record in memory.
export const buildMerchantGraphqlFilter = (
  filter: AudienceFilter,
  now: Date = new Date(),
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

  for (const dateCondition of filter.dateConditions) {
    const { field } = dateCondition;
    const resolved = resolveAudienceDateCondition(dateCondition, now);

    switch (resolved.kind) {
      case 'EMPTY':
        conditions.push({ [field]: { is: 'NULL' } });
        break;
      case 'NOT_EMPTY':
        conditions.push({ [field]: { is: 'NOT_NULL' } });
        break;
      case 'NO_MATCH':
        conditions.push({ id: { is: 'NULL' } });
        break;
      case 'RANGE':
        if (resolved.gte !== null) {
          conditions.push({ [field]: { gte: resolved.gte } });
        }

        if (resolved.lt !== null) {
          conditions.push({ [field]: { lt: resolved.lt } });
        }
        break;
    }
  }

  return { and: conditions };
};
