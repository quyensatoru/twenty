import { defineField, FieldType } from 'twenty-sdk/define';

import {
  MERCHANT_OBJECT_UID,
  MERCHANT_UNINSTALLED_AT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: MERCHANT_UNINSTALLED_AT_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.DATE_TIME,
  name: 'uninstalledAt',
  label: 'Uninstalled at',
  icon: 'IconCalendarMinus',
  isNullable: true,
});
