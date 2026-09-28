import { type AudienceFilter } from '../types/audience-filter';

export const EMPTY_AUDIENCE_FILTER: AudienceFilter = {
  appIds: [],
  installStatus: 'ANY',
  shopifyPlans: [],
  pricingPlans: [],
  countries: [],
};
