import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  EMAIL_SUPPRESSION_NAME_FIELD_UID,
  EMAIL_SUPPRESSION_OBJECT_UID,
  EMAIL_SUPPRESSION_REASON_FIELD_UID,
  EMAIL_SUPPRESSION_REASON_UNSUBSCRIBED_OPTION_UID,
  EMAIL_SUPPRESSION_SUPPRESSED_AT_FIELD_UID,
} from '../constants/universal-identifiers';

// An address to never mail again, keyed by email rather than by merchant: a
// manual broadcast recipient has no merchant row for `emailUnsubscribed` to
// live on. Every broadcast checks this list in addition to its own audience.
export default defineObject({
  universalIdentifier: EMAIL_SUPPRESSION_OBJECT_UID,
  nameSingular: 'emailSuppression',
  namePlural: 'emailSuppressions',
  labelSingular: 'Email suppression',
  labelPlural: 'Email suppressions',
  description: 'An address that unsubscribed and must never be mailed again',
  icon: 'IconMailOff',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    EMAIL_SUPPRESSION_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: EMAIL_SUPPRESSION_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'email',
      label: 'Email',
      description: 'Lowercased address',
      icon: 'IconAt',
      isNullable: false,
      defaultValue: "''",
    },
    {
      universalIdentifier: EMAIL_SUPPRESSION_REASON_FIELD_UID,
      type: FieldType.SELECT,
      name: 'reason',
      label: 'Reason',
      icon: 'IconInfoCircle',
      defaultValue: "'UNSUBSCRIBED'",
      options: [
        {
          id: EMAIL_SUPPRESSION_REASON_UNSUBSCRIBED_OPTION_UID,
          label: 'Unsubscribed',
          value: 'UNSUBSCRIBED',
          color: 'gray',
          position: 0,
        },
      ],
    },
    {
      universalIdentifier: EMAIL_SUPPRESSION_SUPPRESSED_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'suppressedAt',
      label: 'Suppressed at',
      icon: 'IconClock',
      isNullable: true,
    },
  ],
});
