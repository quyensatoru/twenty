import {
  defineView,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ISSUE_COMMENT_AUTHOR_FIELD_UID,
  ISSUE_COMMENT_BODY_V2_FIELD_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_COMMENTS_ON_ISSUE_VIEW_UID,
} from '../constants/universal-identifiers';

// Backs the Comments widget on the issue record page. The host renders the
// bodyV2 rich text with its own editor, which is what the fork's hand-rolled
// comment thread was working around.
export default defineView({
  universalIdentifier: ISSUE_COMMENTS_ON_ISSUE_VIEW_UID,
  name: 'Comments',
  objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconMessage',
  position: 1,
  fields: [
    {
      universalIdentifier: '318bca27-83e7-4b06-b6e5-7b0a64cb8078',
      fieldMetadataUniversalIdentifier: ISSUE_COMMENT_BODY_V2_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 380,
    },
    {
      universalIdentifier: '360f115b-0898-45ed-9fc2-da70191943c9',
      fieldMetadataUniversalIdentifier: ISSUE_COMMENT_AUTHOR_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '024d4d88-7b6d-4e58-b246-5a75d2c334bf',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 2,
      isVisible: true,
      size: 150,
    },
  ],
  sorts: [
    {
      universalIdentifier: '54322ccb-ae30-45c3-84ae-719da21cc9f1',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
        name: 'createdAt',
      }),
      direction: ViewSortDirection.ASC,
    },
  ],
});
