import { defineObject, FieldType } from 'twenty-sdk/define';

import { EVENT_MESSAGE_ATTACHMENTS_MAX } from '../constants/event-message-attachments';
import {
  EVENT_MESSAGE_ATTACHMENTS_FIELD_UID,
  EVENT_MESSAGE_AUTHOR_ID_FIELD_UID,
  EVENT_MESSAGE_BODY_FIELD_UID,
  EVENT_MESSAGE_HEART_MEMBER_IDS_FIELD_UID,
  EVENT_MESSAGE_MENTION_MEMBER_IDS_FIELD_UID,
  EVENT_MESSAGE_OBJECT_UID,
  EVENT_MESSAGE_OCCURRENCE_KEY_FIELD_UID,
} from '../constants/universal-identifiers';

// A chat message in an occasion's room. Keyed by occurrence (`kind:source:date`)
// rather than by a record, because a birthday occurrence has no record of its
// own.
export default defineObject({
  universalIdentifier: EVENT_MESSAGE_OBJECT_UID,
  nameSingular: 'eventMessage',
  namePlural: 'eventMessages',
  labelSingular: 'Event Message',
  labelPlural: 'Event Messages',
  description: 'A message in the chat room of an occasion',
  icon: 'IconMessage',
  labelIdentifierFieldMetadataUniversalIdentifier: EVENT_MESSAGE_BODY_FIELD_UID,
  fields: [
    {
      universalIdentifier: EVENT_MESSAGE_BODY_FIELD_UID,
      type: FieldType.TEXT,
      name: 'body',
      label: 'Message',
      icon: 'IconMessage',
      isNullable: false,
      defaultValue: "''",
    },
    {
      universalIdentifier: EVENT_MESSAGE_OCCURRENCE_KEY_FIELD_UID,
      type: FieldType.TEXT,
      name: 'occurrenceKey',
      label: 'Occurrence',
      icon: 'IconKey',
      isNullable: false,
      defaultValue: "''",
    },
    {
      universalIdentifier: EVENT_MESSAGE_AUTHOR_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'authorId',
      label: 'Author member id',
      icon: 'IconUser',
      isNullable: true,
    },
    {
      universalIdentifier: EVENT_MESSAGE_HEART_MEMBER_IDS_FIELD_UID,
      type: FieldType.ARRAY,
      name: 'heartMemberIds',
      label: 'Hearted by',
      icon: 'IconHeart',
      isNullable: true,
    },
    {
      universalIdentifier: EVENT_MESSAGE_MENTION_MEMBER_IDS_FIELD_UID,
      type: FieldType.ARRAY,
      name: 'mentionMemberIds',
      label: 'Mentioned',
      icon: 'IconAt',
      isNullable: true,
    },
    {
      universalIdentifier: EVENT_MESSAGE_ATTACHMENTS_FIELD_UID,
      type: FieldType.FILES,
      name: 'media',
      label: 'Media',
      description: 'Images, GIFs and videos sent with the message',
      icon: 'IconPhoto',
      isNullable: true,
      universalSettings: { maxNumberOfValues: EVENT_MESSAGE_ATTACHMENTS_MAX },
    },
  ],
});
