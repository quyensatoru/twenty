import { defineField, FieldType } from 'twenty-sdk/define';

import {
  MERCHANT_CONTACT_NAME_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_CONTACT_NAME_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.TEXT,
  name: 'contactName',
  label: 'Contact name',
  description: 'Shop owner first name, used by {{contactName}} in emails',
  icon: 'IconUser',
});
