import { defineIndex } from 'twenty-sdk/define';

import {
  BC_TASK_OBJECT_UID,
  BC_TASK_OWNER_FIELD_UID,
  BC_TASK_OWNER_CREATED_INDEX_FIELD_UID,
  BC_TASK_OWNER_CREATED_INDEX_UID,

} from '../constants/universal-identifiers';

// Task lists are per owner.
export default defineIndex({
  universalIdentifier: BC_TASK_OWNER_CREATED_INDEX_UID,
  objectUniversalIdentifier: BC_TASK_OBJECT_UID,
  fields: [
    {
      universalIdentifier: BC_TASK_OWNER_CREATED_INDEX_FIELD_UID,
      fieldUniversalIdentifier: BC_TASK_OWNER_FIELD_UID,
    },
  ],
});
