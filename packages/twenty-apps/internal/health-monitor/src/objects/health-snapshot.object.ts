import { defineObject, FieldType } from 'twenty-sdk/define';

import { SNAPSHOT_STATUS_OPTIONS } from '../constants/select-options';
import {
  HEALTH_SNAPSHOT_ERROR_FIELD_UID,
  HEALTH_SNAPSHOT_HTTP_STATUS_FIELD_UID,
  HEALTH_SNAPSHOT_LATENCY_MS_FIELD_UID,
  HEALTH_SNAPSHOT_METRICS_FIELD_UID,
  HEALTH_SNAPSHOT_NAME_FIELD_UID,
  HEALTH_SNAPSHOT_OBJECT_UID,
  HEALTH_SNAPSHOT_POLLED_AT_FIELD_UID,
  HEALTH_SNAPSHOT_STATUS_FIELD_UID,
} from '../constants/universal-identifiers';

// One row per poll, trimmed to the numbers the charts read, and destroyed by
// the hourly cleanup once older than the monitor's retention.
export default defineObject({
  universalIdentifier: HEALTH_SNAPSHOT_OBJECT_UID,
  nameSingular: 'healthSnapshot',
  namePlural: 'healthSnapshots',
  labelSingular: 'Health Snapshot',
  labelPlural: 'Health Snapshots',
  description: 'Node and process metrics read by one health poll',
  icon: 'IconCamera',
  isSearchable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    HEALTH_SNAPSHOT_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: HEALTH_SNAPSHOT_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Poll time, for record lists',
      icon: 'IconCamera',
      isNullable: false,
      defaultValue: "''",
    },
    {
      universalIdentifier: HEALTH_SNAPSHOT_POLLED_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'polledAt',
      label: 'Polled at',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: HEALTH_SNAPSHOT_STATUS_FIELD_UID,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconHeartRateMonitor',
      isNullable: false,
      defaultValue: "'OK'",
      options: [...SNAPSHOT_STATUS_OPTIONS],
    },
    {
      universalIdentifier: HEALTH_SNAPSHOT_LATENCY_MS_FIELD_UID,
      type: FieldType.NUMBER,
      name: 'latencyMs',
      label: 'Latency (ms)',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: HEALTH_SNAPSHOT_HTTP_STATUS_FIELD_UID,
      type: FieldType.NUMBER,
      name: 'httpStatus',
      label: 'HTTP status',
      icon: 'IconNumber',
      isNullable: true,
    },
    {
      universalIdentifier: HEALTH_SNAPSHOT_ERROR_FIELD_UID,
      type: FieldType.TEXT,
      name: 'error',
      label: 'Error',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
    {
      universalIdentifier: HEALTH_SNAPSHOT_METRICS_FIELD_UID,
      type: FieldType.RAW_JSON,
      name: 'metrics',
      label: 'Metrics',
      icon: 'IconChartLine',
      isNullable: true,
    },
  ],
});
