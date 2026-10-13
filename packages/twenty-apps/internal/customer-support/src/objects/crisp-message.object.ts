import { defineObject, FieldType } from 'twenty-sdk/define';

import { CRISP_MESSAGE_SENDER_OPTIONS } from '../constants/crisp';
import {
  CRISP_MESSAGE_CONTENT_FIELD_UID,
  CRISP_MESSAGE_FINGERPRINT_FIELD_UID,
  CRISP_MESSAGE_MESSAGE_TYPE_FIELD_UID,
  CRISP_MESSAGE_OBJECT_UID,
  CRISP_MESSAGE_SENDER_FIELD_UID,
  CRISP_MESSAGE_SENDER_NAME_FIELD_UID,
  CRISP_MESSAGE_SENT_AT_FIELD_UID,
  CRISP_MESSAGE_TEXT_FIELD_UID,
} from '../constants/universal-identifiers';

// The record id is derived from (website, session, fingerprint): Crisp retries
// a webhook it thinks failed, and the sync re-reads messages the webhook
// already wrote, so every write is an idempotent upsert on that id.
export default defineObject({
  universalIdentifier: CRISP_MESSAGE_OBJECT_UID,
  nameSingular: 'crispMessage',
  namePlural: 'crispMessages',
  labelSingular: 'Crisp message',
  labelPlural: 'Crisp messages',
  description: 'A message of a Crisp conversation',
  icon: 'IconMessage',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: CRISP_MESSAGE_TEXT_FIELD_UID,
  fields: [
    {
      universalIdentifier: CRISP_MESSAGE_TEXT_FIELD_UID,
      type: FieldType.TEXT,
      name: 'text',
      label: 'Text',
      description: 'Readable text of the message',
      icon: 'IconAlignLeft',
      isNullable: true,
      isSearchable: true,
    },
    {
      universalIdentifier: CRISP_MESSAGE_SENDER_FIELD_UID,
      type: FieldType.SELECT,
      name: 'sender',
      label: 'Sender',
      description: 'Customer or support',
      icon: 'IconUser',
      isNullable: true,
      options: [...CRISP_MESSAGE_SENDER_OPTIONS],
    },
    {
      universalIdentifier: CRISP_MESSAGE_SENDER_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'senderName',
      label: 'Sender name',
      description: 'Display name of the sender',
      icon: 'IconUserCircle',
      isNullable: true,
    },
    {
      universalIdentifier: CRISP_MESSAGE_MESSAGE_TYPE_FIELD_UID,
      type: FieldType.TEXT,
      name: 'messageType',
      label: 'Type',
      description: 'Crisp message type: text, file, note, picker...',
      icon: 'IconCategory',
      isNullable: true,
    },
    {
      universalIdentifier: CRISP_MESSAGE_SENT_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'sentAt',
      label: 'Sent at',
      description: 'When the message was sent',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: CRISP_MESSAGE_FINGERPRINT_FIELD_UID,
      type: FieldType.TEXT,
      name: 'fingerprint',
      label: 'Fingerprint',
      description: 'Crisp message id',
      icon: 'IconFingerprint',
      isNullable: true,
    },
    {
      universalIdentifier: CRISP_MESSAGE_CONTENT_FIELD_UID,
      type: FieldType.RAW_JSON,
      name: 'content',
      label: 'Content',
      description: 'Original Crisp content, for files, pickers and fields',
      icon: 'IconBraces',
      isNullable: true,
    },
  ],
});
