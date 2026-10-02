import {
  definePageLayoutWidget,
  PageLayoutTabLayoutMode,
} from 'twenty-sdk/define';

import {
  MERCHANT_CUSTOM_SETTINGS_FRONT_COMPONENT_UID,
  MERCHANT_CUSTOM_SETTINGS_WIDGET_UID,
  STANDARD_MERCHANT_RECORD_PAGE_HOME_TAB_UID,
} from '../constants/universal-identifiers';

// Standalone, not part of a page layout this app declares: the merchant record
// page is "Default Merchant Layout", which the Standard application owns, and
// customer-support owns the merchant object itself. A widget attaches to
// another application's tab; redeclaring the page would take it from both.
//
// Index 1 puts it directly under the Fields widget the engine put at 0, where
// the raw customSettings cell is — the form is what that cell should have
// been, so it belongs next to it.
export default definePageLayoutWidget({
  universalIdentifier: MERCHANT_CUSTOM_SETTINGS_WIDGET_UID,
  pageLayoutTabUniversalIdentifier:
    STANDARD_MERCHANT_RECORD_PAGE_HOME_TAB_UID,
  title: 'Custom Settings',
  type: 'FRONT_COMPONENT',
  position: { layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST, index: 1 },
  configuration: {
    configurationType: 'FRONT_COMPONENT',
    frontComponentUniversalIdentifier:
      MERCHANT_CUSTOM_SETTINGS_FRONT_COMPONENT_UID,
  },
});
