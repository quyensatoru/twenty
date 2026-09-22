import { defineView, ViewType } from 'twenty-sdk/define';

import { UPSELL_DEAL_STAGE_OPTIONS } from '../constants/pipeline-stages';
import {
  DEALS_PIPELINE_VIEW_UID,
  OWNER_ON_UPSELL_DEAL_FIELD_UID,
  PROSPECT_ON_UPSELL_DEAL_FIELD_UID,
  UPSELL_DEAL_NAME_FIELD_UID,
  UPSELL_DEAL_NEXT_FOLLOW_UP_AT_FIELD_UID,
  UPSELL_DEAL_OBJECT_UID,
  UPSELL_DEAL_STAGE_FIELD_UID,
  TARGET_APP_ON_UPSELL_DEAL_FIELD_UID,
} from '../constants/universal-identifiers';

const GROUP_IDS = [
  '2aaf8aff-e4ce-49dc-8f5d-384fdee1824f',
  '27d64f64-d89d-4078-a388-8bbc26e1d05b',
  '7e390097-d1a2-41d7-91b1-217edecc846b',
  'edcdf688-a280-4e1d-88f2-f5b85f25d3d2',
  '4a98235b-44e3-4223-909b-c960ab0445f1',
  '6ec0d5ac-2ffe-4006-a198-649f797e8821',
  'da154d56-5d1c-449b-8cf5-272e7e8de487',
  '98f1e1c5-c5d5-416a-a9c8-296f3fac165b',
];

// Owner is tracked on the prospect, not per deal: with a single BD the two
// always agree, and the customer list needs owner as a real column and filter
// (spec 5.1), which a to-many relation cannot provide. The deal's own `owner`
// field stays in the model for the multi-BD case the spec anticipates, but it
// is hidden here so nobody maintains two owners that can drift apart. Turning
// it back on is one click in Options, or isVisible: true below.
export default defineView({
  universalIdentifier: DEALS_PIPELINE_VIEW_UID,
  name: 'Upsell pipeline',
  objectUniversalIdentifier: UPSELL_DEAL_OBJECT_UID,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier: UPSELL_DEAL_STAGE_FIELD_UID,
  fields: [
    {
      universalIdentifier: 'de223f63-9291-4971-bf85-15bba84be94c',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '3ec52aad-5328-4595-b81d-8f43c97838b4',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_STAGE_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '6151c14c-8851-465a-9b76-41c7e252c8fb',
      fieldMetadataUniversalIdentifier: PROSPECT_ON_UPSELL_DEAL_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '1f070b18-8ec2-44c1-b1de-8f6ba84830af',
      fieldMetadataUniversalIdentifier: TARGET_APP_ON_UPSELL_DEAL_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'cbed754e-3131-4586-85e7-692da8af928d',
      fieldMetadataUniversalIdentifier: OWNER_ON_UPSELL_DEAL_FIELD_UID,
      position: 4,
      isVisible: false,
      size: 150,
    },
    {
      universalIdentifier: '0fa90bc7-b1d0-49e5-a9a5-2f8c274e3fa8',
      fieldMetadataUniversalIdentifier: UPSELL_DEAL_NEXT_FOLLOW_UP_AT_FIELD_UID,
      position: 5,
      isVisible: true,
      size: 150,
    },
  ],
  groups: UPSELL_DEAL_STAGE_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
