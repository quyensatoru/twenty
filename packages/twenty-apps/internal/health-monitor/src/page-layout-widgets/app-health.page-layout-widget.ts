import {
  definePageLayoutWidget,
  PageLayoutTabLayoutMode,
} from 'twenty-sdk/define';

import {
  APP_HEALTH_FRONT_COMPONENT_UID,
  APP_HEALTH_WIDGET_UID,
  APP_RECORD_PAGE_TAB_UID,
} from '../constants/universal-identifiers';

// Standalone: the App record page belongs to Task Manager, and a widget can
// attach to another application's tab without redeclaring its page.
export default definePageLayoutWidget({
  universalIdentifier: APP_HEALTH_WIDGET_UID,
  pageLayoutTabUniversalIdentifier: APP_RECORD_PAGE_TAB_UID,
  title: 'Health',
  type: 'FRONT_COMPONENT',
  position: {
    layoutMode: PageLayoutTabLayoutMode.GRID,
    row: 12,
    column: 0,
    rowSpan: 10,
    columnSpan: 12,
  },
  configuration: {
    configurationType: 'FRONT_COMPONENT',
    frontComponentUniversalIdentifier: APP_HEALTH_FRONT_COMPONENT_UID,
  },
});
