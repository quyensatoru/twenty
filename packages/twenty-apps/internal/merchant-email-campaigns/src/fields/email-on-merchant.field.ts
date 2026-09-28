import { defineField, FieldType } from 'twenty-sdk/define';

import {
  MERCHANT_EMAIL_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

// Named `email` on purpose: bd-prospects already reads `merchant.email` when
// the column exists, so the sync filling it serves both apps.
export default defineField({
  universalIdentifier: MERCHANT_EMAIL_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.EMAILS,
  name: 'email',
  label: 'Email',
  description: 'Shop owner contact address campaigns are sent to',
  icon: 'IconMail',
  isNullable: true,
});
