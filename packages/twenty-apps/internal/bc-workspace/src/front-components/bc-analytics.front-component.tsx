import { defineFrontComponent } from 'twenty-sdk/define';

import { ANALYTICS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { AnalyticsPage } from './components/analytics-page';

export default defineFrontComponent({
  universalIdentifier: ANALYTICS_FRONT_COMPONENT_UID,
  name: 'bc-analytics',
  description:
    'BC Analytics: balanced KPIs for a BC or their team over a reporting period, with drilldowns, Shopify reviews and manager-only financials.',
  component: AnalyticsPage,
});
