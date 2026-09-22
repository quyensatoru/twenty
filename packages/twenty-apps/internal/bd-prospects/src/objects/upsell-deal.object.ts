import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  UPSELL_DEAL_DEFAULT_STAGE,
  UPSELL_DEAL_STAGE_OPTIONS,
} from '../constants/pipeline-stages';
import {
  UPSELL_DEAL_NAME_FIELD_UID,
  UPSELL_DEAL_NEXT_FOLLOW_UP_AT_FIELD_UID,
  UPSELL_DEAL_OBJECT_UID,
  UPSELL_DEAL_STAGE_FIELD_UID,
  UPSELL_DEAL_SUGGESTED_CLOSE_AT_FIELD_UID,
  UPSELL_DEAL_SUGGESTED_CLOSE_FIELD_UID,
} from '../constants/universal-identifiers';

// One deal per (prospect, target app), so a shop can be worked on for several
// apps at once and closing one does not erase the history of the others. The
// target app is a relation to the `app` registry (see
// fields/target-app-on-upsell-deal.field.ts), which also puts this object
// inside the workspace's app-scope enforcement.
export default defineObject({
  universalIdentifier: UPSELL_DEAL_OBJECT_UID,
  nameSingular: 'upsellDeal',
  namePlural: 'upsellDeals',
  labelSingular: 'Upsell deal',
  labelPlural: 'Upsell deals',
  description: 'A BD deal to bring one shop onto one target app',
  icon: 'IconTrendingUp',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: UPSELL_DEAL_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: UPSELL_DEAL_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Filled as "<domain> to <target app>" when created by BD',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: UPSELL_DEAL_STAGE_FIELD_UID,
      type: FieldType.SELECT,
      name: 'stage',
      label: 'Stage',
      icon: 'IconProgress',
      defaultValue: `'${UPSELL_DEAL_DEFAULT_STAGE}'`,
      options: [...UPSELL_DEAL_STAGE_OPTIONS],
    },
    {
      universalIdentifier: UPSELL_DEAL_NEXT_FOLLOW_UP_AT_FIELD_UID,
      type: FieldType.DATE,
      name: 'nextFollowUpAt',
      label: 'Next follow-up',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier: UPSELL_DEAL_SUGGESTED_CLOSE_FIELD_UID,
      type: FieldType.BOOLEAN,
      name: 'suggestedClose',
      label: 'Suggested close',
      description:
        'Set by the system when the shop is detected on the target app. BD still moves the stage by hand.',
      icon: 'IconBulb',
      defaultValue: false,
    },
    {
      universalIdentifier: UPSELL_DEAL_SUGGESTED_CLOSE_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'suggestedCloseAt',
      label: 'Suggested close at',
      icon: 'IconClockCheck',
      isNullable: true,
    },
  ],
});
