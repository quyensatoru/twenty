import { defineFrontComponent } from 'twenty-sdk/define';

import { DASHBOARD_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { DashboardPage } from './components/dashboard-page';

export default defineFrontComponent({
  universalIdentifier: DASHBOARD_FRONT_COMPONENT_UID,
  name: 'bc-dashboard',
  description:
    'VIP client dashboard: one row per shop with per-app plan, health and review, client profile, issues and developer tasks.',
  component: DashboardPage,
});
