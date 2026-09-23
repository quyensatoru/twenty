import { defineView, ViewType } from 'twenty-sdk/define';

import {
  OWNER_ON_UPSELL_DEAL_FIELD_UID,
  PROSPECT_ON_UPSELL_DEAL_FIELD_UID,
  TARGET_APP_ON_UPSELL_DEAL_FIELD_UID,
  UPSELL_DEAL_FIELDS_VIEW_UID,
  UPSELL_DEAL_NEXT_FOLLOW_UP_AT_FIELD_UID,
  UPSELL_DEAL_OBJECT_UID,
  UPSELL_DEAL_STAGE_FIELD_UID,
  UPSELL_DEAL_SUGGESTED_CLOSE_AT_FIELD_UID,
  UPSELL_DEAL_SUGGESTED_CLOSE_FIELD_UID,
} from '../constants/universal-identifiers';

// Not a page of its own: this is what the Fields widget of the deal record page
// reads. A FIELDS widget with no view falls back to every active field, which is
// how the deal detail ended up showing Created by, Updated by, Attachments and
// the rest. Listing fields here is the only way to hide them — a field left out
// simply does not render.
//
// `name` is deliberately absent: it is the label identifier and already shows as
// the record title.
export default defineView({
  universalIdentifier: UPSELL_DEAL_FIELDS_VIEW_UID,
  name: 'Deal fields',
  objectUniversalIdentifier: UPSELL_DEAL_OBJECT_UID,
  type: ViewType.FIELDS_WIDGET,
  icon: 'IconList',
  position: 0,
  fields: [
    {
      universalIdentifier: '6f4637a7-bccf-4935-badc-412e277d9913',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_STAGE_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '749ba09d-2900-4e83-bd20-a6393491227f',
      fieldMetadataUniversalIdentifier: TARGET_APP_ON_UPSELL_DEAL_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '7a730d21-6c12-40c4-9e70-744d9337516a',
      fieldMetadataUniversalIdentifier: PROSPECT_ON_UPSELL_DEAL_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '2c4142ca-edd5-43b8-96a1-1321bcfc8d4d',
      fieldMetadataUniversalIdentifier:
        UPSELL_DEAL_NEXT_FOLLOW_UP_AT_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '07bab31a-3b77-453e-91bf-de26000328ee',
      fieldMetadataUniversalIdentifier: OWNER_ON_UPSELL_DEAL_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '8b6e923a-f129-465d-bd40-b498c1b22d64',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_SUGGESTED_CLOSE_FIELD_UID,
      position: 5,
      isVisible: true,
      size: 100,
    },
    {
      universalIdentifier: '24840fe7-7ca3-42b6-9db7-171bf474ada4',
      fieldMetadataUniversalIdentifier:
        UPSELL_DEAL_SUGGESTED_CLOSE_AT_FIELD_UID,
      position: 6,
      isVisible: true,
      size: 100,
    },
  ],
});
