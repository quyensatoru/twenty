import { defineIndex } from 'twenty-sdk/define';

import {
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_PIC_FIELD_UID,
  VIP_CLIENT_PIC_INDEX_FIELD_UID,
  VIP_CLIENT_PIC_INDEX_UID,

} from '../constants/universal-identifiers';

// Every BC view starts from the clients a PIC owns.
export default defineIndex({
  universalIdentifier: VIP_CLIENT_PIC_INDEX_UID,
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  fields: [
    {
      universalIdentifier: VIP_CLIENT_PIC_INDEX_FIELD_UID,
      fieldUniversalIdentifier: VIP_CLIENT_PIC_FIELD_UID,
    },
  ],
});
