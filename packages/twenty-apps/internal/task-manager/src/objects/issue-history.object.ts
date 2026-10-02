import { defineObject, FieldType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ISSUE_HISTORY_ACTION_FIELD_UID,
  ISSUE_HISTORY_FROM_STATUS_ID_FIELD_UID,
  ISSUE_HISTORY_OBJECT_UID,
  ISSUE_HISTORY_TO_STATUS_ID_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineObject({
  universalIdentifier: ISSUE_HISTORY_OBJECT_UID,
  nameSingular: 'issueHistory',
  namePlural: 'issueHistories',
  labelSingular: 'Issue History',
  labelPlural: 'Issue Histories',
  description:
    'System-event feed of an issue: its creation and every tracked field change, rendered by the History tab',
  icon: 'IconHistory',
  // Same derived-`id` arrangement as worklog.object.ts: `id` is engine-derived
  // and can never appear in `fields` below.
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: ISSUE_HISTORY_OBJECT_UID,
      name: 'id',
    }),
  fields: [
    {
      // `created` or `status-changed`. New actions stay in this one column so
      // the feed never needs a schema change to learn a new event. Nullable
      // like every other TEXT field here; the triggers always write it.
      universalIdentifier: ISSUE_HISTORY_ACTION_FIELD_UID,
      type: FieldType.TEXT,
      name: 'action',
      label: 'Action',
      description: 'What happened: created, status-changed, …',
      icon: 'IconHistory',
      isNullable: true,
    },
    {
      // Raw status record ids, not names: names are resolved at read time
      // from the project's statuses, so a renamed status does not rewrite
      // history.
      universalIdentifier: ISSUE_HISTORY_FROM_STATUS_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'fromStatusId',
      label: 'From status id',
      description: 'Status record id before the change, if any',
      icon: 'IconArrowLeft',
      isNullable: true,
    },
    {
      universalIdentifier: ISSUE_HISTORY_TO_STATUS_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'toStatusId',
      label: 'To status id',
      description: 'Status record id after the change, if any',
      icon: 'IconArrowRight',
      isNullable: true,
    },
  ],
});
