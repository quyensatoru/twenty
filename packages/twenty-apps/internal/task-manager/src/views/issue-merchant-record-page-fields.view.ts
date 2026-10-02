import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ISSUE_MERCHANT_ISSUE_FIELD_UID,
  ISSUE_MERCHANT_MERCHANT_FIELD_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  ISSUE_MERCHANT_RECORD_PAGE_FIELDS_VIEW_UID,
} from '../constants/universal-identifiers';

// See app-record-page-fields.view.ts for why a FIELDS widget must have a view.
//
// This object is a junction and is normally reached through Issue.merchants or
// Merchant.issues rather than browsed. The page exists so that landing on a row
// from a search result or a relation chip shows something instead of nothing.
export default defineView({
  universalIdentifier: ISSUE_MERCHANT_RECORD_PAGE_FIELDS_VIEW_UID,
  name: 'Issue Merchant Record Page Fields',
  objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
  type: ViewType.FIELDS_WIDGET,
  fields: [
    {
      universalIdentifier: 'd6f97696-34f8-4f9c-9d40-1b5cbfdeaaa2',
      fieldMetadataUniversalIdentifier: ISSUE_MERCHANT_ISSUE_FIELD_UID,
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier: '212e0631-f8f4-4940-afcc-5bfb95ec654d',
      fieldMetadataUniversalIdentifier: ISSUE_MERCHANT_MERCHANT_FIELD_UID,
      position: 1,
      isVisible: true,
    },
  ],
});
