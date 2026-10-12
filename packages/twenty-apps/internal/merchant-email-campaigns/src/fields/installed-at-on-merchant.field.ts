import { defineField, FieldType } from 'twenty-sdk/define';

import {
  MERCHANT_INSTALLED_AT_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_INSTALLED_AT_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.DATE_TIME,
  name: 'installedAt',
  label: 'Installed at',
  icon: 'IconCalendarPlus',
  isNullable: true,
});
