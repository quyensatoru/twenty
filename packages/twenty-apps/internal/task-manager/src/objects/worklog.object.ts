import { defineObject, FieldType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  WORKLOG_DESCRIPTION_FIELD_UID,
  WORKLOG_OBJECT_UID,
  WORKLOG_STARTED_AT_FIELD_UID,
  WORKLOG_TIME_SPENT_MINUTES_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineObject({
  universalIdentifier: WORKLOG_OBJECT_UID,
  nameSingular: 'worklog',
  namePlural: 'worklogs',
  labelSingular: 'Worklog',
  labelPlural: 'Worklogs',
  description: 'A logged time entry on an issue',
  icon: 'IconClock',
  // `id` is engine-derived, so it can never appear in `fields` below and
  // `twenty plan` warns that it cannot verify this identifier. The warning is
  // a false alarm here and the two alternatives are both worse: omitting the
  // identifier makes the engine synthesise a `name` column on the table, and
  // declaring `id` in `fields` is rejected outright with
  // FIELD_MUTATION_NOT_ALLOWED. The derived values are pinned by
  // __tests__/derived-label-identifiers.test.ts against what the engine stores.
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: WORKLOG_OBJECT_UID,
      name: 'id',
    }),
  fields: [
    {
      universalIdentifier: WORKLOG_DESCRIPTION_FIELD_UID,
      type: FieldType.TEXT,
      name: 'description',
      label: 'Description',
      description: 'Worklog description',
      icon: 'IconNotes',
      isNullable: true,
      isSearchable: true,
    },
    {
      universalIdentifier: WORKLOG_TIME_SPENT_MINUTES_FIELD_UID,
      type: FieldType.NUMBER,
      name: 'timeSpentMinutes',
      label: 'Time spent (minutes)',
      description: 'Time logged in minutes',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: WORKLOG_STARTED_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'startedAt',
      label: 'Started at',
      description: 'When the logged work started',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
  ],
});
