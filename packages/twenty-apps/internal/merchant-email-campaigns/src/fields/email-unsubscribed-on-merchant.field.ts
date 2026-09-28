import { defineField, FieldType } from 'twenty-sdk/define';

import {
  MERCHANT_EMAIL_UNSUBSCRIBED_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_EMAIL_UNSUBSCRIBED_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.BOOLEAN,
  name: 'emailUnsubscribed',
  label: 'Unsubscribed from emails',
  description:
    'Set by the unsubscribe link. No campaign mails a merchant with this on.',
  icon: 'IconMailOff',
  defaultValue: false,
});
