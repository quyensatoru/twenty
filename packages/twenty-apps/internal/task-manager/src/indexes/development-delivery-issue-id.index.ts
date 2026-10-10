import { defineIndex } from 'twenty-sdk/define';

import {
  DEVELOPMENT_DELIVERY_ISSUE_FIELD_UID,
  DEVELOPMENT_DELIVERY_ISSUE_INDEX_FIELD_UID,
  DEVELOPMENT_DELIVERY_ISSUE_INDEX_UID,
  DEVELOPMENT_DELIVERY_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineIndex({
  universalIdentifier: DEVELOPMENT_DELIVERY_ISSUE_INDEX_UID,
  objectUniversalIdentifier: DEVELOPMENT_DELIVERY_OBJECT_UID,
  fields: [
    {
      universalIdentifier: DEVELOPMENT_DELIVERY_ISSUE_INDEX_FIELD_UID,
      fieldUniversalIdentifier: DEVELOPMENT_DELIVERY_ISSUE_FIELD_UID,
    },
  ],
});
