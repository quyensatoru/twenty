import { defineCommandMenuItem, pageType } from 'twenty-sdk/define';

import {
  EXPORT_PROSPECTS_COMMAND_MENU_ITEM_UID,
  EXPORT_PROSPECTS_FRONT_COMPONENT_UID,
  PROSPECT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: EXPORT_PROSPECTS_COMMAND_MENU_ITEM_UID,
  frontComponentUniversalIdentifier: EXPORT_PROSPECTS_FRONT_COMPONENT_UID,
  label: 'Export prospects',
  shortLabel: 'Export prospects',
  isPinned: true,
  availabilityType: 'GLOBAL_OBJECT_CONTEXT',
  conditionalAvailabilityExpression: pageType === 'INDEX_PAGE',
  availabilityObjectUniversalIdentifier: PROSPECT_OBJECT_UID,
});
