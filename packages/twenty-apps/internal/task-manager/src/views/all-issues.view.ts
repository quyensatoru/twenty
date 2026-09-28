import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ALL_ISSUES_VIEW_UID,
  ISSUE_ASSIGNEE_FIELD_UID,
  ISSUE_DUE_DATE_FIELD_UID,
  ISSUE_EPIC_FIELD_UID,
  ISSUE_KEY_FIELD_UID,
  ISSUE_OBJECT_UID,
  ISSUE_PRIORITY_FIELD_UID,
  ISSUE_STATUS_FIELD_UID,
  ISSUE_TITLE_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_ISSUES_VIEW_UID,
  name: 'Issues',
  objectUniversalIdentifier: ISSUE_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconList',
  position: 0,
  fields: [
    {
      universalIdentifier: '72428bd7-2352-4355-9813-4cc76979839a',
      fieldMetadataUniversalIdentifier: ISSUE_KEY_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: 'aba617ab-3bb9-4c99-915a-81c5d6d76961',
      fieldMetadataUniversalIdentifier: ISSUE_TITLE_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 280,
    },
    {
      universalIdentifier: 'e59806b6-dbe5-4461-b08e-6411eb5afc5c',
      fieldMetadataUniversalIdentifier: ISSUE_STATUS_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: 'db6b7f86-1316-4237-a769-9c6a622e051a',
      fieldMetadataUniversalIdentifier: ISSUE_PRIORITY_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '0fa653dd-7c95-481d-b665-2ae2ebd0a110',
      fieldMetadataUniversalIdentifier: ISSUE_ASSIGNEE_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'fa83a431-03fb-4290-b8f6-6dd66b1d05ab',
      fieldMetadataUniversalIdentifier: ISSUE_DUE_DATE_FIELD_UID,
      position: 5,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '5e6beda3-dba7-44c1-a79c-05a4135e9e98',
      fieldMetadataUniversalIdentifier: ISSUE_EPIC_FIELD_UID,
      position: 6,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'a1e36bcb-a5be-41f2-90e7-b3bb76b857ef',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: ISSUE_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 7,
      isVisible: true,
      size: 150,
    },
  ],
});
