import {
  defineView,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import { SELLABLE_APPS } from '../constants/registered-apps';
import { HIGH_VALUE_SHOPIFY_PLANS } from '../constants/shopify-plans';
import {
  ALL_PROSPECTS_VIEW_UID,
  MERCHANTS_ON_PROSPECT_FIELD_UID,
  UPSELL_DEALS_ON_PROSPECT_FIELD_UID,
  OWNER_ON_PROSPECT_FIELD_UID,
  PROSPECT_OTHER_APPS_FIELD_UID,
  PROSPECT_OUR_APPS_FIELD_UID,
  PROSPECT_EMAIL_FIELD_UID,
  PROSPECT_DOMAIN_FIELD_UID,
  PROSPECT_OBJECT_UID,
  PROSPECT_SHOP_NAME_FIELD_UID,
  PROSPECT_SHOPIFY_PLAN_FIELD_UID,
} from '../constants/universal-identifiers';

// One column per sellable app sits here, so everything after it shifts when a
// new app is added.
const FIRST_STAGE_COLUMN = 6;
const AFTER_STAGE_COLUMNS = FIRST_STAGE_COLUMN + SELLABLE_APPS.length;

export default defineView({
  universalIdentifier: ALL_PROSPECTS_VIEW_UID,
  name: 'High-Value Prospects',
  objectUniversalIdentifier: PROSPECT_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconTargetArrow',
  position: 0,
  fields: [
    {
      universalIdentifier: 'e4569dbf-ea80-4459-af97-a309b2732450',
      fieldMetadataUniversalIdentifier: PROSPECT_DOMAIN_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '659f9dda-8aa5-42ad-b1d1-a8c62d016a9b',
      fieldMetadataUniversalIdentifier: PROSPECT_SHOP_NAME_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '0b5850f0-4d11-4edd-83f7-88d52d9db76d',
      fieldMetadataUniversalIdentifier: PROSPECT_EMAIL_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '10ad9f17-2011-4b4d-8506-ab61db06b68c',
      fieldMetadataUniversalIdentifier: PROSPECT_SHOPIFY_PLAN_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: 'd6036798-6dfa-405d-b921-d25b6cf2a7f7',
      fieldMetadataUniversalIdentifier: PROSPECT_OUR_APPS_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '818cfebc-ba6a-4099-9f60-d8efab4025c0',
      fieldMetadataUniversalIdentifier: PROSPECT_OTHER_APPS_FIELD_UID,
      position: 5,
      isVisible: true,
      size: 180,
    },
    ...SELLABLE_APPS.map((app, index) => ({
      universalIdentifier: app.stage.allProspectsViewFieldUniversalIdentifier,
      fieldMetadataUniversalIdentifier: app.stage.fieldUniversalIdentifier,
      position: FIRST_STAGE_COLUMN + index,
      isVisible: true,
      size: 150,
    })),
    {
      // The stage columns read the pipeline but cannot link to it. This one is
      // the way in: its chips open the deal itself.
      universalIdentifier: 'bd88c36d-68f0-43d5-965a-5834a08e938a',
      fieldMetadataUniversalIdentifier: UPSELL_DEALS_ON_PROSPECT_FIELD_UID,
      position: AFTER_STAGE_COLUMNS,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '0a29e350-4955-4d62-9e16-66666837a5b4',
      fieldMetadataUniversalIdentifier: OWNER_ON_PROSPECT_FIELD_UID,
      position: AFTER_STAGE_COLUMNS + 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '814f2ed0-e39a-4e03-b33c-4e7f4e70a1c7',
      fieldMetadataUniversalIdentifier: MERCHANTS_ON_PROSPECT_FIELD_UID,
      position: AFTER_STAGE_COLUMNS + 2,
      // Hidden: merchant records are labelled by the same domain, so the column
      // repeated the Domain column. Still reachable from the record page.
      isVisible: false,
      size: 200,
    },
  ],
  filters: [
    {
      universalIdentifier: '452f4cdb-4ec9-46c4-a9a6-13f146f707f4',
      fieldMetadataUniversalIdentifier: PROSPECT_SHOPIFY_PLAN_FIELD_UID,
      operand: ViewFilterOperand.IS,
      value: [...HIGH_VALUE_SHOPIFY_PLANS],
    },
  ],
  sorts: [
    {
      universalIdentifier: '8237eff6-f94f-49de-b448-3c3025b511c4',
      fieldMetadataUniversalIdentifier: PROSPECT_DOMAIN_FIELD_UID,
      direction: ViewSortDirection.ASC,
    },
  ],
});
