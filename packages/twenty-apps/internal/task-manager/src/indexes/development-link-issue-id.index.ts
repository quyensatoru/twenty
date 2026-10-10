import { defineIndex } from 'twenty-sdk/define';

import {
  DEVELOPMENT_LINK_ISSUE_FIELD_UID,
  DEVELOPMENT_LINK_ISSUE_ID_INDEX_FIELD_UID,
  DEVELOPMENT_LINK_ISSUE_ID_INDEX_UID,
  DEVELOPMENT_LINK_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: DEVELOPMENT_LINK_ISSUE_ID_INDEX_UID,
  objectUniversalIdentifier: DEVELOPMENT_LINK_OBJECT_UID,
  fields: [
    {
      universalIdentifier: DEVELOPMENT_LINK_ISSUE_ID_INDEX_FIELD_UID,
      fieldUniversalIdentifier: DEVELOPMENT_LINK_ISSUE_FIELD_UID,
    },
  ],
});
