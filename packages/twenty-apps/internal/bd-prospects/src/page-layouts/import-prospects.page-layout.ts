import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  IMPORT_PAGE_LAYOUT_TAB_UID,
  IMPORT_PAGE_LAYOUT_UID,
  IMPORT_PAGE_LAYOUT_WIDGET_UID,
  IMPORT_WIZARD_FRONT_COMPONENT_UID,
} from '../constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: IMPORT_PAGE_LAYOUT_UID,
  name: 'Import prospects',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: IMPORT_PAGE_LAYOUT_TAB_UID,
      title: 'Import',
      position: 0,
      icon: 'IconFileImport',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: IMPORT_PAGE_LAYOUT_WIDGET_UID,
          title: 'Import prospects from CSV',
          type: 'FRONT_COMPONENT',
          gridPosition: { row: 0, column: 0, rowSpan: 6, columnSpan: 12 },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              IMPORT_WIZARD_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
