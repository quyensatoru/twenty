import { defineObject, FieldType } from 'twenty-sdk/define';

import { HEALTH_METRICS } from '../types/health-metric';
import {
  INCIDENT_STATUS_OPTIONS,
  PEAK_SEVERITY_OPTIONS,
  SEVERITY_OPTIONS,
} from '../constants/select-options';
import {
  HEALTH_INCIDENT_ACKNOWLEDGED_AT_FIELD_UID,
  HEALTH_INCIDENT_ACKNOWLEDGED_BY_FIELD_UID,
  HEALTH_INCIDENT_BREACH_COUNT_FIELD_UID,
  HEALTH_INCIDENT_DEDUPE_KEY_FIELD_UID,
  HEALTH_INCIDENT_FIRST_BREACH_AT_FIELD_UID,
  HEALTH_INCIDENT_HOST_FIELD_UID,
  HEALTH_INCIDENT_LAST_NOTIFIED_AT_FIELD_UID,
  HEALTH_INCIDENT_LAST_VALUE_FIELD_UID,
  HEALTH_INCIDENT_METRIC_FIELD_UID,
  HEALTH_INCIDENT_NODE_KEY_FIELD_UID,
  HEALTH_INCIDENT_NOTIFY_COUNT_FIELD_UID,
  HEALTH_INCIDENT_OBJECT_UID,
  HEALTH_INCIDENT_OPENED_AT_FIELD_UID,
  HEALTH_INCIDENT_PEAK_SEVERITY_FIELD_UID,
  HEALTH_INCIDENT_PEAK_VALUE_FIELD_UID,
  HEALTH_INCIDENT_RESOLVED_AT_FIELD_UID,
  HEALTH_INCIDENT_SERVICE_NAME_FIELD_UID,
  HEALTH_INCIDENT_SEVERITY_FIELD_UID,
  HEALTH_INCIDENT_STATUS_FIELD_UID,
  HEALTH_INCIDENT_THRESHOLD_FIELD_UID,
  HEALTH_INCIDENT_TITLE_FIELD_UID,
} from '../constants/universal-identifiers';

const textField = (
  universalIdentifier: string,
  name: string,
  label: string,
  icon: string,
) => ({
  universalIdentifier,
  type: FieldType.TEXT as const,
  name,
  label,
  icon,
  isNullable: true as const,
});

const dateField = (
  universalIdentifier: string,
  name: string,
  label: string,
) => ({
  universalIdentifier,
  type: FieldType.DATE_TIME as const,
  name,
  label,
  icon: 'IconClock',
  isNullable: true as const,
});

const numberField = (
  universalIdentifier: string,
  name: string,
  label: string,
) => ({
  universalIdentifier,
  type: FieldType.NUMBER as const,
  name,
  label,
  icon: 'IconNumber',
  isNullable: true as const,
});

const counterField = (
  universalIdentifier: string,
  name: string,
  label: string,
) => ({
  universalIdentifier,
  type: FieldType.NUMBER as const,
  name,
  label,
  icon: 'IconNumber',
  isNullable: false,
  defaultValue: 0,
});

// PENDING rows are breaches waiting for the consecutive-poll count; they are
// destroyed when the breach clears first, so only real incidents stay.
export default defineObject({
  universalIdentifier: HEALTH_INCIDENT_OBJECT_UID,
  nameSingular: 'healthIncident',
  namePlural: 'healthIncidents',
  labelSingular: 'Health Incident',
  labelPlural: 'Health Incidents',
  description:
    'A threshold breach on a node or process, from first breach to recovery',
  icon: 'IconAlertTriangle',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    HEALTH_INCIDENT_TITLE_FIELD_UID,
  fields: [
    {
      universalIdentifier: HEALTH_INCIDENT_TITLE_FIELD_UID,
      type: FieldType.TEXT,
      name: 'title',
      label: 'Title',
      icon: 'IconAlertTriangle',
      isNullable: false,
      defaultValue: "''",
      isSearchable: true,
    },
    {
      universalIdentifier: HEALTH_INCIDENT_DEDUPE_KEY_FIELD_UID,
      type: FieldType.TEXT,
      name: 'dedupeKey',
      label: 'Dedupe key',
      description: 'node:process:metric, one active incident per key',
      icon: 'IconKey',
      isNullable: false,
      defaultValue: "''",
    },
    textField(
      HEALTH_INCIDENT_NODE_KEY_FIELD_UID,
      'nodeKey',
      'Node',
      'IconServer',
    ),
    textField(HEALTH_INCIDENT_HOST_FIELD_UID, 'host', 'Host', 'IconWorld'),
    textField(
      HEALTH_INCIDENT_SERVICE_NAME_FIELD_UID,
      'serviceName',
      'Process',
      'IconTerminal',
    ),
    {
      universalIdentifier: HEALTH_INCIDENT_METRIC_FIELD_UID,
      type: FieldType.TEXT,
      name: 'metric',
      label: 'Metric',
      description: HEALTH_METRICS.join(', '),
      icon: 'IconChartLine',
      isNullable: false,
      defaultValue: "''",
    },
    {
      universalIdentifier: HEALTH_INCIDENT_SEVERITY_FIELD_UID,
      type: FieldType.SELECT,
      name: 'severity',
      label: 'Severity',
      icon: 'IconAlertTriangle',
      isNullable: false,
      defaultValue: "'WARNING'",
      options: [...SEVERITY_OPTIONS],
    },
    {
      universalIdentifier: HEALTH_INCIDENT_PEAK_SEVERITY_FIELD_UID,
      type: FieldType.SELECT,
      name: 'peakSeverity',
      label: 'Peak severity',
      icon: 'IconAlertTriangle',
      isNullable: false,
      defaultValue: "'WARNING'",
      options: [...PEAK_SEVERITY_OPTIONS],
    },
    {
      universalIdentifier: HEALTH_INCIDENT_STATUS_FIELD_UID,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      isNullable: false,
      defaultValue: "'PENDING'",
      options: [...INCIDENT_STATUS_OPTIONS],
    },
    counterField(
      HEALTH_INCIDENT_BREACH_COUNT_FIELD_UID,
      'breachCount',
      'Breaches',
    ),
    numberField(
      HEALTH_INCIDENT_LAST_VALUE_FIELD_UID,
      'lastValue',
      'Last value',
    ),
    numberField(
      HEALTH_INCIDENT_PEAK_VALUE_FIELD_UID,
      'peakValue',
      'Peak value',
    ),
    numberField(HEALTH_INCIDENT_THRESHOLD_FIELD_UID, 'threshold', 'Threshold'),
    dateField(
      HEALTH_INCIDENT_FIRST_BREACH_AT_FIELD_UID,
      'firstBreachAt',
      'First breach at',
    ),
    dateField(HEALTH_INCIDENT_OPENED_AT_FIELD_UID, 'openedAt', 'Opened at'),
    dateField(
      HEALTH_INCIDENT_RESOLVED_AT_FIELD_UID,
      'resolvedAt',
      'Resolved at',
    ),
    dateField(
      HEALTH_INCIDENT_LAST_NOTIFIED_AT_FIELD_UID,
      'lastNotifiedAt',
      'Last emailed at',
    ),
    counterField(
      HEALTH_INCIDENT_NOTIFY_COUNT_FIELD_UID,
      'notifyCount',
      'Emails sent',
    ),
    textField(
      HEALTH_INCIDENT_ACKNOWLEDGED_BY_FIELD_UID,
      'acknowledgedByMemberId',
      'Acknowledged by (member id)',
      'IconUserCheck',
    ),
    dateField(
      HEALTH_INCIDENT_ACKNOWLEDGED_AT_FIELD_UID,
      'acknowledgedAt',
      'Acknowledged at',
    ),
  ],
});
