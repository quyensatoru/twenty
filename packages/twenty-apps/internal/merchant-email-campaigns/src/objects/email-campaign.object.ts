import { defineObject, FieldType } from 'twenty-sdk/define';

import { CAMPAIGN_STATUS_OPTIONS } from '../constants/campaign-status-options';
import { CAMPAIGN_TYPE_OPTIONS } from '../constants/campaign-type-options';
import { MERCHANT_TRIGGER_OPTIONS } from '../constants/merchant-trigger-options';
import {
  EMAIL_CAMPAIGN_AUDIENCE_FILTER_FIELD_UID,
  EMAIL_CAMPAIGN_COMPLETED_AT_FIELD_UID,
  EMAIL_CAMPAIGN_DELAY_MINUTES_FIELD_UID,
  EMAIL_CAMPAIGN_EVENT_NAME_FIELD_UID,
  EMAIL_CAMPAIGN_FROM_EMAIL_FIELD_UID,
  EMAIL_CAMPAIGN_LAST_ERROR_FIELD_UID,
  EMAIL_CAMPAIGN_NAME_FIELD_UID,
  EMAIL_CAMPAIGN_OBJECT_UID,
  EMAIL_CAMPAIGN_REPLY_TO_FIELD_UID,
  EMAIL_CAMPAIGN_SCHEDULED_AT_FIELD_UID,
  EMAIL_CAMPAIGN_SEND_ONCE_FIELD_UID,
  EMAIL_CAMPAIGN_STARTED_AT_FIELD_UID,
  EMAIL_CAMPAIGN_STATUS_FIELD_UID,
  EMAIL_CAMPAIGN_TRIGGER_FIELD_UID,
  EMAIL_CAMPAIGN_TYPE_FIELD_UID,
} from '../constants/universal-identifiers';

// The audience is a JSON filter rather than relations to `app`: a MANY_TO_ONE
// edge to `app` would pull campaigns into the fork's app-scope enforcement and
// hide them from every member without a grant on each targeted app.
export default defineObject({
  universalIdentifier: EMAIL_CAMPAIGN_OBJECT_UID,
  nameSingular: 'emailCampaign',
  namePlural: 'emailCampaigns',
  labelSingular: 'Email campaign',
  labelPlural: 'Email campaigns',
  description:
    'An automation fired by merchant status changes, or a one-off broadcast to a merchant segment',
  icon: 'IconSpeakerphone',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    EMAIL_CAMPAIGN_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: EMAIL_CAMPAIGN_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_TYPE_FIELD_UID,
      type: FieldType.SELECT,
      name: 'campaignType',
      label: 'Type',
      icon: 'IconCategory',
      defaultValue: "'AUTOMATION'",
      options: [...CAMPAIGN_TYPE_OPTIONS],
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_STATUS_FIELD_UID,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      description:
        'Changed through Email Studio, which checks the campaign is ready to send',
      icon: 'IconProgress',
      defaultValue: "'DRAFT'",
      options: [...CAMPAIGN_STATUS_OPTIONS],
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_TRIGGER_FIELD_UID,
      type: FieldType.SELECT,
      name: 'trigger',
      label: 'Trigger',
      description: 'Merchant event that sends an automation',
      icon: 'IconBolt',
      isNullable: true,
      options: [...MERCHANT_TRIGGER_OPTIONS],
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_EVENT_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'eventName',
      label: 'Event name',
      description:
        'For the Custom event trigger: the event_name other apps post, e.g. trial_ending',
      icon: 'IconBroadcast',
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_DELAY_MINUTES_FIELD_UID,
      type: FieldType.NUMBER,
      name: 'delayMinutes',
      label: 'Delay (minutes)',
      description: 'Wait between the merchant event and the email',
      icon: 'IconClockPause',
      defaultValue: 0,
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_AUDIENCE_FILTER_FIELD_UID,
      type: FieldType.RAW_JSON,
      name: 'audienceFilter',
      label: 'Audience filter',
      description:
        'Apps, install status, plans and countries the campaign targets',
      icon: 'IconFilter',
      isNullable: true,
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_FROM_EMAIL_FIELD_UID,
      type: FieldType.TEXT,
      name: 'fromEmail',
      label: 'From',
      description:
        'e.g. "MIDA Team <hello@mida.so>". Empty uses the app default.',
      icon: 'IconSend',
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_REPLY_TO_FIELD_UID,
      type: FieldType.TEXT,
      name: 'replyTo',
      label: 'Reply-To',
      icon: 'IconArrowBackUp',
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_SEND_ONCE_FIELD_UID,
      type: FieldType.BOOLEAN,
      name: 'sendOncePerMerchant',
      label: 'Send once per merchant',
      description:
        'Automations only: never mail the same merchant twice from this campaign',
      icon: 'IconRepeatOnce',
      defaultValue: true,
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_SCHEDULED_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'scheduledAt',
      label: 'Scheduled for',
      icon: 'IconCalendarTime',
      isNullable: true,
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_STARTED_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'startedAt',
      label: 'Started at',
      icon: 'IconPlayerPlay',
      isNullable: true,
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_COMPLETED_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'completedAt',
      label: 'Completed at',
      icon: 'IconCircleCheck',
      isNullable: true,
    },
    {
      universalIdentifier: EMAIL_CAMPAIGN_LAST_ERROR_FIELD_UID,
      type: FieldType.TEXT,
      name: 'lastError',
      label: 'Last error',
      icon: 'IconAlertTriangle',
    },
  ],
});
