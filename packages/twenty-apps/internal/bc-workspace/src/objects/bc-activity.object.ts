import { defineObject } from 'twenty-sdk/define';

import {
  ACTIVITY_DIRECTION_OPTIONS,
  ACTIVITY_TOPIC_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  MEETING_STATUS_OPTIONS,
} from '../constants/select-options';
import {
  BC_ACTIVITY_ACTOR_MEMBER_ID_FIELD_UID,
  BC_ACTIVITY_APP_NAME_FIELD_UID,
  BC_ACTIVITY_DEVELOPER_ISSUE_ID_FIELD_UID,
  BC_ACTIVITY_DIRECTION_FIELD_UID,
  BC_ACTIVITY_EXTERNAL_ID_FIELD_UID,
  BC_ACTIVITY_IS_BC_AUTHORED_FIELD_UID,
  BC_ACTIVITY_MEETING_STATUS_FIELD_UID,
  BC_ACTIVITY_METADATA_FIELD_UID,
  BC_ACTIVITY_OBJECT_UID,
  BC_ACTIVITY_OCCURRED_AT_FIELD_UID,
  BC_ACTIVITY_SOURCE_URL_FIELD_UID,
  BC_ACTIVITY_SUMMARY_FIELD_UID,
  BC_ACTIVITY_TITLE_FIELD_UID,
  BC_ACTIVITY_TOPIC_FIELD_UID,
  BC_ACTIVITY_TYPE_FIELD_UID,
} from '../constants/universal-identifiers';
import {
  booleanField,
  dateTimeField,
  rawJsonField,
  selectField,
  textField,
  uuidField,
} from '../utils/field-builders.util';

// The client timeline and the evidence behind every BC metric: who did what,
// when. Credit stays with the recorded actor even after a PIC change.
export default defineObject({
  universalIdentifier: BC_ACTIVITY_OBJECT_UID,
  nameSingular: 'bcActivity',
  namePlural: 'bcActivities',
  labelSingular: 'BC Activity',
  labelPlural: 'BC Activities',
  description: 'A client timeline entry: contact, meeting, status or system event',
  icon: 'IconTimeline',
  isSearchable: false,
  labelIdentifierFieldMetadataUniversalIdentifier: BC_ACTIVITY_TITLE_FIELD_UID,
  fields: [
    textField({
      universalIdentifier: BC_ACTIVITY_TITLE_FIELD_UID,
      name: 'title',
      label: 'Title',
      icon: 'IconTimeline',
    }),
    textField({
      universalIdentifier: BC_ACTIVITY_SUMMARY_FIELD_UID,
      name: 'summary',
      label: 'Summary',
      icon: 'IconNotes',
    }),
    selectField({
      universalIdentifier: BC_ACTIVITY_TYPE_FIELD_UID,
      name: 'activityType',
      label: 'Type',
      icon: 'IconCategory',
      options: ACTIVITY_TYPE_OPTIONS,
      defaultValue: 'NOTE',
    }),
    selectField({
      universalIdentifier: BC_ACTIVITY_DIRECTION_FIELD_UID,
      name: 'direction',
      label: 'Direction',
      icon: 'IconArrowsExchange',
      options: ACTIVITY_DIRECTION_OPTIONS,
      defaultValue: 'INTERNAL',
    }),
    selectField({
      universalIdentifier: BC_ACTIVITY_TOPIC_FIELD_UID,
      name: 'topic',
      label: 'Topic',
      icon: 'IconTag',
      options: ACTIVITY_TOPIC_OPTIONS,
      defaultValue: 'GENERAL',
    }),
    selectField({
      universalIdentifier: BC_ACTIVITY_MEETING_STATUS_FIELD_UID,
      name: 'meetingStatus',
      label: 'Meeting status',
      icon: 'IconCalendarEvent',
      options: MEETING_STATUS_OPTIONS,
    }),
    booleanField({
      universalIdentifier: BC_ACTIVITY_IS_BC_AUTHORED_FIELD_UID,
      name: 'isBcAuthored',
      label: 'BC authored',
      description: 'Counts as BC contact for engagement and attribution',
      icon: 'IconUserCheck',
      defaultValue: false,
    }),
    uuidField({
      universalIdentifier: BC_ACTIVITY_ACTOR_MEMBER_ID_FIELD_UID,
      name: 'actorMemberId',
      label: 'Actor',
      icon: 'IconUser',
    }),
    dateTimeField({
      universalIdentifier: BC_ACTIVITY_OCCURRED_AT_FIELD_UID,
      name: 'occurredAt',
      label: 'Occurred at',
      icon: 'IconClock',
    }),
    textField({
      universalIdentifier: BC_ACTIVITY_APP_NAME_FIELD_UID,
      name: 'appName',
      label: 'App',
      icon: 'IconApps',
    }),
    {
      ...textField({
        universalIdentifier: BC_ACTIVITY_EXTERNAL_ID_FIELD_UID,
        name: 'externalId',
        label: 'External ID',
        description:
          'Source event id (Crisp message, meeting, webhook) that makes imports idempotent',
        icon: 'IconKey',
      }),
      isUnique: true,
    },
    textField({
      universalIdentifier: BC_ACTIVITY_SOURCE_URL_FIELD_UID,
      name: 'sourceUrl',
      label: 'Source link',
      icon: 'IconLink',
    }),
    uuidField({
      universalIdentifier: BC_ACTIVITY_DEVELOPER_ISSUE_ID_FIELD_UID,
      name: 'developerIssueId',
      label: 'Developer task',
      description: 'Task Manager issue created from this client',
      icon: 'IconCode',
    }),
    rawJsonField({
      universalIdentifier: BC_ACTIVITY_METADATA_FIELD_UID,
      name: 'metadata',
      label: 'Details',
      description:
        'Event specifics, e.g. { fromMemberId, toMemberId } for a PIC change',
      icon: 'IconBraces',
    }),
  ],
});
