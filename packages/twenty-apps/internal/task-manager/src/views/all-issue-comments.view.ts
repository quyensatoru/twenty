import { defineView, ViewType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ALL_ISSUE_COMMENTS_VIEW_UID,
  ISSUE_COMMENT_AUTHOR_FIELD_UID,
  ISSUE_COMMENT_BODY_V2_FIELD_UID,
  ISSUE_COMMENT_ISSUE_FIELD_UID,
  ISSUE_COMMENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_ISSUE_COMMENTS_VIEW_UID,
  name: 'Issue Comments',
  objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconMessage',
  position: 0,
  fields: [
    {
      universalIdentifier: '4ba9d298-a4a3-4752-883e-5766b318456e',
      fieldMetadataUniversalIdentifier: ISSUE_COMMENT_BODY_V2_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 320,
    },
    {
      universalIdentifier: 'e8ac783d-34e9-4743-9954-c5afbe56c79c',
      fieldMetadataUniversalIdentifier: ISSUE_COMMENT_ISSUE_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: 'dfd51c14-9c46-44b2-bf7e-51a73a491875',
      fieldMetadataUniversalIdentifier: ISSUE_COMMENT_AUTHOR_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '8cd19650-661b-4d1a-91fb-1cd96d936235',
      fieldMetadataUniversalIdentifier: getSystemFieldUniversalIdentifier({
        objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
        name: 'createdAt',
      }),
      position: 3,
      isVisible: true,
      size: 150,
    },
  ],
});
