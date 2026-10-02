import { defineObject, FieldType } from 'twenty-sdk/define';

import { MERCHANT_EVENT_STATUS_OPTIONS } from '../constants/merchant-event-status-options';
import {
  MERCHANT_EVENT_CAMPAIGNS_QUEUED_FIELD_UID,
  MERCHANT_EVENT_DOMAIN_FIELD_UID,
  MERCHANT_EVENT_EMAIL_FIELD_UID,
  MERCHANT_EVENT_NAME_FIELD_UID,
  MERCHANT_EVENT_OBJECT_UID,
  MERCHANT_EVENT_OCCURRED_AT_FIELD_UID,
  MERCHANT_EVENT_PROPERTIES_FIELD_UID,
  MERCHANT_EVENT_STATUS_FIELD_UID,
} from '../constants/universal-identifiers';

// Every event another app posts is kept, matched or not: an UNMATCHED row is
// how the team finds out the sender uses a domain the sync never created, and
// the distinct names in here are the catalogue the studio offers when someone
// binds an automation to an event.
export default defineObject({
  universalIdentifier: MERCHANT_EVENT_OBJECT_UID,
  nameSingular: 'merchantEvent',
  namePlural: 'merchantEvents',
  labelSingular: 'Merchant event',
  labelPlural: 'Merchant events',
  description: 'An event posted by another app (Brevo-compatible events API)',
  icon: 'IconBroadcast',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    MERCHANT_EVENT_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: MERCHANT_EVENT_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Event',
      description:
        'event_name, normalized: trimmed, lowercased, spaces as underscores. The raw spelling is kept in Properties when it differed.',
      icon: 'IconBroadcast',
    },
    {
      universalIdentifier: MERCHANT_EVENT_EMAIL_FIELD_UID,
      type: FieldType.TEXT,
      name: 'email',
      label: 'Email',
      description: 'identifiers.email_id as sent',
      icon: 'IconMail',
    },
    {
      universalIdentifier: MERCHANT_EVENT_DOMAIN_FIELD_UID,
      type: FieldType.TEXT,
      name: 'domain',
      label: 'Domain',
      description: 'contact_properties.DOMAIN as sent',
      icon: 'IconWorld',
    },
    {
      universalIdentifier: MERCHANT_EVENT_PROPERTIES_FIELD_UID,
      type: FieldType.RAW_JSON,
      name: 'properties',
      label: 'Properties',
      description: 'contact_properties and event_properties as sent',
      icon: 'IconBraces',
      isNullable: true,
    },
    {
      universalIdentifier: MERCHANT_EVENT_OCCURRED_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'occurredAt',
      label: 'Occurred at',
      description: 'event_date, or the time it was received',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: MERCHANT_EVENT_STATUS_FIELD_UID,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      defaultValue: "'MATCHED'",
      options: [...MERCHANT_EVENT_STATUS_OPTIONS],
    },
    {
      universalIdentifier: MERCHANT_EVENT_CAMPAIGNS_QUEUED_FIELD_UID,
      type: FieldType.NUMBER,
      name: 'campaignsQueued',
      label: 'Emails queued',
      description: 'How many automations this event queued an email for',
      icon: 'IconMailForward',
      defaultValue: 0,
    },
  ],
});
