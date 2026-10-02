import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ISSUE_STATUS_CATEGORY_FIELD_UID,
  ISSUE_STATUS_COLOR_FIELD_UID,
  ISSUE_STATUS_ISSUES_FIELD_UID,
  ISSUE_STATUS_NAME_FIELD_UID,
  ISSUE_STATUS_OBJECT_UID,
  ISSUE_STATUS_PROJECT_FIELD_UID,
  ISSUE_STATUS_RECORD_PAGE_FIELDS_VIEW_UID,
} from '../constants/universal-identifiers';

// See app-record-page-fields.view.ts for why a FIELDS widget must have a view.
export default defineView({
  universalIdentifier: ISSUE_STATUS_RECORD_PAGE_FIELDS_VIEW_UID,
  name: 'Issue Status Record Page Fields',
  objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID,
  type: ViewType.FIELDS_WIDGET,
  fields: [
    {
      universalIdentifier: 'f86cdba5-01e7-44d4-9db6-9b30480f4409',
      fieldMetadataUniversalIdentifier: ISSUE_STATUS_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier: '1431c0e3-a566-4036-aac9-f58550ca8638',
      fieldMetadataUniversalIdentifier: ISSUE_STATUS_CATEGORY_FIELD_UID,
      position: 1,
      isVisible: true,
    },
    {
      universalIdentifier: 'c556bc4c-a2a5-4f1f-b05a-b733f294f73e',
      fieldMetadataUniversalIdentifier: ISSUE_STATUS_COLOR_FIELD_UID,
      position: 2,
      isVisible: true,
    },
    {
      universalIdentifier: 'd0f0d45f-996f-46a9-94a3-bcb7233aecca',
      fieldMetadataUniversalIdentifier: ISSUE_STATUS_PROJECT_FIELD_UID,
      position: 3,
      isVisible: true,
    },
    {
      universalIdentifier: '1f488fde-a7f2-44ba-8297-4d7f6428b6f8',
      fieldMetadataUniversalIdentifier: ISSUE_STATUS_ISSUES_FIELD_UID,
      position: 4,
      isVisible: true,
    },
  ],
});
