import { defineObject } from 'twenty-sdk/define';

import {
  ISSUE_SOURCE_OPTIONS,
  ISSUE_STATUS_OPTIONS,
} from '../constants/select-options';
import {
  BC_ISSUE_APP_NAMES_FIELD_UID,
  BC_ISSUE_CLASSIFICATION_FIELD_UID,
  BC_ISSUE_CONFIDENCE_FIELD_UID,
  BC_ISSUE_DETECTED_AT_FIELD_UID,
  BC_ISSUE_DISMISS_REASON_FIELD_UID,
  BC_ISSUE_EVIDENCE_FIELD_UID,
  BC_ISSUE_HISTORY_FIELD_UID,
  BC_ISSUE_LAST_EVIDENCE_AT_FIELD_UID,
  BC_ISSUE_OBJECT_UID,
  BC_ISSUE_RESOLVED_AT_FIELD_UID,
  BC_ISSUE_RESOLVED_BY_MEMBER_ID_FIELD_UID,
  BC_ISSUE_SOURCE_FIELD_UID,
  BC_ISSUE_STATUS_FIELD_UID,
  BC_ISSUE_SUMMARY_FIELD_UID,
  BC_ISSUE_TITLE_FIELD_UID,
} from '../constants/universal-identifiers';
import {
  arrayField,
  dateTimeField,
  numberField,
  rawJsonField,
  selectField,
  textField,
  uuidField,
} from '../utils/field-builders.util';

// A client problem that puts the client At Risk until a BC confirms it is
// resolved. Developer tickets live in Task Manager and never close one.
export default defineObject({
  universalIdentifier: BC_ISSUE_OBJECT_UID,
  nameSingular: 'bcIssue',
  namePlural: 'bcIssues',
  labelSingular: 'Client Issue',
  labelPlural: 'Client Issues',
  description: 'A problem reported by a VIP client, detected by AI or logged by a BC',
  icon: 'IconAlertTriangle',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: BC_ISSUE_TITLE_FIELD_UID,
  fields: [
    textField({
      universalIdentifier: BC_ISSUE_TITLE_FIELD_UID,
      name: 'title',
      label: 'Title',
      icon: 'IconAlertTriangle',
      isSearchable: true,
    }),
    textField({
      universalIdentifier: BC_ISSUE_SUMMARY_FIELD_UID,
      name: 'summary',
      label: 'Summary',
      icon: 'IconFileDescription',
    }),
    textField({
      universalIdentifier: BC_ISSUE_CLASSIFICATION_FIELD_UID,
      name: 'classification',
      label: 'Classification',
      description: 'Short reusable topic such as "Points not awarded"',
      icon: 'IconTag',
    }),
    selectField({
      universalIdentifier: BC_ISSUE_STATUS_FIELD_UID,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      options: ISSUE_STATUS_OPTIONS,
      defaultValue: 'OPEN',
    }),
    selectField({
      universalIdentifier: BC_ISSUE_SOURCE_FIELD_UID,
      name: 'source',
      label: 'Source',
      icon: 'IconSparkles',
      options: ISSUE_SOURCE_OPTIONS,
      defaultValue: 'MANUAL',
    }),
    arrayField({
      universalIdentifier: BC_ISSUE_APP_NAMES_FIELD_UID,
      name: 'appNames',
      label: 'Affected apps',
      icon: 'IconApps',
    }),
    dateTimeField({
      universalIdentifier: BC_ISSUE_DETECTED_AT_FIELD_UID,
      name: 'detectedAt',
      label: 'Detected at',
      icon: 'IconClock',
    }),
    dateTimeField({
      universalIdentifier: BC_ISSUE_LAST_EVIDENCE_AT_FIELD_UID,
      name: 'lastEvidenceAt',
      label: 'Last evidence at',
      icon: 'IconClock',
    }),
    dateTimeField({
      universalIdentifier: BC_ISSUE_RESOLVED_AT_FIELD_UID,
      name: 'resolvedAt',
      label: 'Closed at',
      icon: 'IconCircleCheck',
    }),
    uuidField({
      universalIdentifier: BC_ISSUE_RESOLVED_BY_MEMBER_ID_FIELD_UID,
      name: 'resolvedByMemberId',
      label: 'Closed by',
      icon: 'IconUser',
    }),
    textField({
      universalIdentifier: BC_ISSUE_DISMISS_REASON_FIELD_UID,
      name: 'dismissReason',
      label: 'Dismiss reason',
      icon: 'IconBan',
    }),
    numberField({
      universalIdentifier: BC_ISSUE_CONFIDENCE_FIELD_UID,
      name: 'confidence',
      label: 'AI confidence',
      icon: 'IconPercentage',
    }),
    rawJsonField({
      universalIdentifier: BC_ISSUE_EVIDENCE_FIELD_UID,
      name: 'evidence',
      label: 'Evidence',
      description:
        'Source messages: [{ conversationId, messageId, excerpt, sentAt, url }]',
      icon: 'IconFileSearch',
    }),
    rawJsonField({
      universalIdentifier: BC_ISSUE_HISTORY_FIELD_UID,
      name: 'history',
      label: 'History',
      description: 'Audit trail: [{ at, actorMemberId, action, from, to, note }]',
      icon: 'IconHistory',
    }),
  ],
});
