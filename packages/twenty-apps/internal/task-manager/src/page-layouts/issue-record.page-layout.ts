import {
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  ISSUE_OBJECT_UID,
  ISSUE_RECORD_MAIN_FRONT_COMPONENT_UID,
  ISSUE_RECORD_PAGE_FIELDS_TAB_UID,
  ISSUE_RECORD_PAGE_LAYOUT_UID,
  ISSUE_RECORD_PAGE_MAIN_WIDGET_UID,
} from '../constants/universal-identifiers';

// One tab holding one widget: the app's issue view, the same component the
// board opens as a modal, laid out as a page. It takes the tab's viewport
// height and scrolls inside it, so the description, sub-issues and activity
// read in one column while the properties sidebar stays beside them; in a
// narrow side panel the sidebar wraps under the content.
//
// The host's FIELDS, FIELD_RICH_TEXT, Files and Timeline widgets are not used:
// they read with the viewer's own token, which Member loses once app-scope is
// enforced (DEPLOY.md 4.1), and Files and Timeline resolve through morph
// branches the cutover had to delete. Every read and write here goes through
// the app's scoped routes.
export default definePageLayout({
  universalIdentifier: ISSUE_RECORD_PAGE_LAYOUT_UID,
  name: 'Issue Record Page',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  tabs: [
    {
      universalIdentifier: ISSUE_RECORD_PAGE_FIELDS_TAB_UID,
      title: 'Issue',
      position: 0,
      icon: 'IconLayoutKanban',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: ISSUE_RECORD_PAGE_MAIN_WIDGET_UID,
          // A widget always draws its header bar and the manifest validator
          // rejects an empty string, so a space is how a widget says it has
          // no title of its own.
          title: ' ',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              ISSUE_RECORD_MAIN_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
  ],
});
