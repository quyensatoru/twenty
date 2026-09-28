import { defineObject, FieldType } from 'twenty-sdk/define';

import { EMAIL_SEND_STATUS_OPTIONS } from '../constants/email-send-status-options';
import {
  EMAIL_SEND_ERROR_MESSAGE_FIELD_UID,
  EMAIL_SEND_NAME_FIELD_UID,
  EMAIL_SEND_OBJECT_UID,
  EMAIL_SEND_PROVIDER_MESSAGE_ID_FIELD_UID,
  EMAIL_SEND_SENT_AT_FIELD_UID,
  EMAIL_SEND_STATUS_FIELD_UID,
  EMAIL_SEND_SUBJECT_FIELD_UID,
  EMAIL_SEND_TRIGGER_FIELD_UID,
} from '../constants/universal-identifiers';

// One row per message attempt. It is both the audit log and the dedupe key:
// a campaign never mails an address that already has a SENT row here.
export default defineObject({
  universalIdentifier: EMAIL_SEND_OBJECT_UID,
  nameSingular: 'emailSend',
  namePlural: 'emailSends',
  labelSingular: 'Email send',
  labelPlural: 'Email sends',
  description: 'A single email sent, failed or skipped by a campaign',
  icon: 'IconMailForward',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: EMAIL_SEND_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: EMAIL_SEND_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Recipient',
      description: 'Address the email went to, lowercased',
      icon: 'IconAt',
    },
    {
      universalIdentifier: EMAIL_SEND_SUBJECT_FIELD_UID,
      type: FieldType.TEXT,
      name: 'subject',
      label: 'Subject',
      icon: 'IconMail',
    },
    {
      universalIdentifier: EMAIL_SEND_STATUS_FIELD_UID,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      defaultValue: "'SENT'",
      options: [...EMAIL_SEND_STATUS_OPTIONS],
    },
    {
      universalIdentifier: EMAIL_SEND_TRIGGER_FIELD_UID,
      type: FieldType.TEXT,
      name: 'trigger',
      label: 'Trigger',
      description: 'Merchant event, or BROADCAST',
      icon: 'IconBolt',
    },
    {
      universalIdentifier: EMAIL_SEND_PROVIDER_MESSAGE_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'providerMessageId',
      label: 'Resend message ID',
      icon: 'IconId',
    },
    {
      universalIdentifier: EMAIL_SEND_ERROR_MESSAGE_FIELD_UID,
      type: FieldType.TEXT,
      name: 'errorMessage',
      label: 'Error',
      icon: 'IconAlertTriangle',
    },
    {
      universalIdentifier: EMAIL_SEND_SENT_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'sentAt',
      label: 'Sent at',
      icon: 'IconClockCheck',
      isNullable: true,
    },
  ],
});
