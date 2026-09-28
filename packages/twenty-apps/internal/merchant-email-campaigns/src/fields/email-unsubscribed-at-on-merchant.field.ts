import { defineField, FieldType } from 'twenty-sdk/define';

import {
  MERCHANT_EMAIL_UNSUBSCRIBED_AT_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_EMAIL_UNSUBSCRIBED_AT_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.DATE_TIME,
  name: 'emailUnsubscribedAt',
  label: 'Unsubscribed at',
  icon: 'IconCalendarX',
  isNullable: true,
});
