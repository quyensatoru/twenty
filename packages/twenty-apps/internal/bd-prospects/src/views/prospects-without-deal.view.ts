import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import { SELLABLE_APPS } from '../constants/registered-apps';
import { HIGH_VALUE_SHOPIFY_PLANS } from '../constants/shopify-plans';
import {
  OWNER_ON_PROSPECT_FIELD_UID,
  PROSPECT_OTHER_APPS_FIELD_UID,
  PROSPECT_OUR_APPS_FIELD_UID,
  PROSPECT_DOMAIN_FIELD_UID,
  PROSPECT_EMAIL_FIELD_UID,
  PROSPECT_OBJECT_UID,
  PROSPECT_SHOPIFY_PLAN_FIELD_UID,
  PROSPECTS_WITHOUT_DEAL_VIEW_UID,
} from '../constants/universal-identifiers';

// The list that actually differs from "High-Value Prospects": shops with no
// open deal on any app, i.e. the queue to work through. One IS_EMPTY filter per
// registered app, since the stage now lives in a column per app.
//
// Narrowing to one upsell direction stays a filter the BD adds on the page
// ("Apps used doesn't contain <app>"), never a saved app name.
export default defineView({
  universalIdentifier: PROSPECTS_WITHOUT_DEAL_VIEW_UID,
  name: 'No deal yet',
  objectUniversalIdentifier: PROSPECT_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconTargetOff',
  position: 1,
  fields: [
    {
      universalIdentifier: '5129ef90-3686-40df-9e3e-37aebfcd83d8',
      fieldMetadataUniversalIdentifier: PROSPECT_DOMAIN_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '62c157f7-a093-4b99-87e9-030176364c72',
      fieldMetadataUniversalIdentifier: PROSPECT_EMAIL_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'b1aabccd-0cdd-439d-aa3f-73419a8752bf',
      fieldMetadataUniversalIdentifier: PROSPECT_SHOPIFY_PLAN_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: '8cc9dbf0-d10e-4641-8e23-1554ac480e87',
      fieldMetadataUniversalIdentifier: PROSPECT_OUR_APPS_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '3690c151-088d-4a0d-8e28-9e103ad09ab3',
      fieldMetadataUniversalIdentifier: PROSPECT_OTHER_APPS_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 180,
    },
    ...SELLABLE_APPS.map((app, index) => ({
      universalIdentifier: app.stage.noDealViewFieldUniversalIdentifier,
      fieldMetadataUniversalIdentifier: app.stage.fieldUniversalIdentifier,
      position: 5 + index,
      isVisible: false,
      size: 150,
    })),
    {
      universalIdentifier: '1d9c87c3-5227-4cd8-8619-2cfede1c027d',
      fieldMetadataUniversalIdentifier: OWNER_ON_PROSPECT_FIELD_UID,
      position: 7,
      isVisible: true,
      size: 150,
    },
  ],
  filters: [
    {
      universalIdentifier: '1dab2b37-33bb-4f3c-a058-883d6edddd7f',
      fieldMetadataUniversalIdentifier: PROSPECT_SHOPIFY_PLAN_FIELD_UID,
      operand: ViewFilterOperand.IS,
      value: [...HIGH_VALUE_SHOPIFY_PLANS],
    },
    ...SELLABLE_APPS.map((app) => ({
      universalIdentifier: app.stage.noDealViewFilterUniversalIdentifier,
      fieldMetadataUniversalIdentifier: app.stage.fieldUniversalIdentifier,
      operand: ViewFilterOperand.IS_EMPTY,
      value: '',
    })),
  ],
});
