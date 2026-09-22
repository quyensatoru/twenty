import {
  defineView,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import { UPSELL_DEAL_CLOSED_STAGES } from '../constants/pipeline-stages';
import {
  DEALS_FOLLOW_UP_VIEW_UID,
  OWNER_ON_UPSELL_DEAL_FIELD_UID,
  PROSPECT_ON_UPSELL_DEAL_FIELD_UID,
  UPSELL_DEAL_NAME_FIELD_UID,
  UPSELL_DEAL_NEXT_FOLLOW_UP_AT_FIELD_UID,
  UPSELL_DEAL_OBJECT_UID,
  UPSELL_DEAL_STAGE_FIELD_UID,
  UPSELL_DEAL_SUGGESTED_CLOSE_FIELD_UID,
  TARGET_APP_ON_UPSELL_DEAL_FIELD_UID,
} from '../constants/universal-identifiers';

// Owner is tracked on the prospect, not per deal: with a single BD the two
// always agree, and the customer list needs owner as a real column and filter
// (spec 5.1), which a to-many relation cannot provide. The deal's own `owner`
// field stays in the model for the multi-BD case the spec anticipates, but it
// is hidden here so nobody maintains two owners that can drift apart. Turning
// it back on is one click in Options, or isVisible: true below.
export default defineView({
  universalIdentifier: DEALS_FOLLOW_UP_VIEW_UID,
  name: 'Open deals by follow-up',
  objectUniversalIdentifier: UPSELL_DEAL_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconCalendarDue',
  position: 1,
  fields: [
    {
      universalIdentifier: '4c056343-1b47-4d14-925e-dd6fec852f5c',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '15b97c0b-52e2-4198-b177-f5052a9381d1',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_NEXT_FOLLOW_UP_AT_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'cdcaaf7f-ca70-4ba1-bff0-10ba8e23a7ff',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_STAGE_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '5e7a9e17-289a-4da4-ba7c-7fb5693aae7e',
      fieldMetadataUniversalIdentifier: PROSPECT_ON_UPSELL_DEAL_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'df45e85e-e324-4832-a234-ba62d7c3622b',
      fieldMetadataUniversalIdentifier: TARGET_APP_ON_UPSELL_DEAL_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '094340a6-5c8c-41aa-ab7a-faf7823792a8',
      fieldMetadataUniversalIdentifier: OWNER_ON_UPSELL_DEAL_FIELD_UID,
      position: 5,
      isVisible: false,
      size: 150,
    },
    {
      universalIdentifier: 'a49f16fa-2f55-4a1d-ade8-8102187fcba8',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_SUGGESTED_CLOSE_FIELD_UID,
      position: 6,
      isVisible: true,
      size: 140,
    },
  ],
  filters: [
    {
      universalIdentifier: '867cd5de-9523-4d69-8aab-b90790a8a09d',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_STAGE_FIELD_UID,
      operand: ViewFilterOperand.IS_NOT,
      value: [...UPSELL_DEAL_CLOSED_STAGES],
    },
  ],
  sorts: [
    {
      universalIdentifier: '14d5654e-15bf-485d-a70b-377800b68c2d',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_NEXT_FOLLOW_UP_AT_FIELD_UID,
      direction: ViewSortDirection.ASC,
    },
  ],
});
