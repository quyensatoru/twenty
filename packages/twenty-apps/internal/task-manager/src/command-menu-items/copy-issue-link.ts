import { defineCommandMenuItem } from 'twenty-sdk/define';

import {
  COPY_ISSUE_LINK_COMMAND_MENU_ITEM_UID,
  COPY_ISSUE_LINK_FRONT_COMPONENT_UID,
  ISSUE_OBJECT_UID,
} from '../constants/universal-identifiers';

// Rendered as an icon button in the Description widget's header, which names
// this item in headerCommandMenuItemUniversalIdentifiers. The host hides the
// label there (CommandMenuItemRenderer with shouldHideLabel), so the label is
// what the tooltip and the command menu show, and the icon is the button.
//
// GLOBAL_OBJECT_CONTEXT, not RECORD_SELECTION: the widget header mounts its own
// CommandMenuContextProvider, whose context api reports no selected records, and
// doesCommandMenuItemMatchSelectionState drops every RECORD_SELECTION item there.
// The object binding below is what still keeps this off every other record page,
// and doesCommandMenuItemMatchPageType keeps it off pages with no record at all.
export default defineCommandMenuItem({
  universalIdentifier: COPY_ISSUE_LINK_COMMAND_MENU_ITEM_UID,
  frontComponentUniversalIdentifier: COPY_ISSUE_LINK_FRONT_COMPONENT_UID,
  label: 'Copy link to issue',
  shortLabel: 'Copy link',
  icon: 'IconLink',
  availabilityType: 'GLOBAL_OBJECT_CONTEXT',
  availabilityObjectUniversalIdentifier: ISSUE_OBJECT_UID,
});
