import {
  HEALTH_INCIDENT_PEAK_SEVERITY_CRITICAL_OPTION_UID,
  HEALTH_INCIDENT_PEAK_SEVERITY_WARNING_OPTION_UID,
  HEALTH_INCIDENT_SEVERITY_CRITICAL_OPTION_UID,
  HEALTH_INCIDENT_SEVERITY_WARNING_OPTION_UID,
  HEALTH_INCIDENT_STATUS_ACKNOWLEDGED_OPTION_UID,
  HEALTH_INCIDENT_STATUS_OPEN_OPTION_UID,
  HEALTH_INCIDENT_STATUS_PENDING_OPTION_UID,
  HEALTH_INCIDENT_STATUS_RESOLVED_OPTION_UID,
  HEALTH_SNAPSHOT_STATUS_CRITICAL_OPTION_UID,
  HEALTH_SNAPSHOT_STATUS_OK_OPTION_UID,
  HEALTH_SNAPSHOT_STATUS_UNREACHABLE_OPTION_UID,
  HEALTH_SNAPSHOT_STATUS_WARNING_OPTION_UID,
} from './universal-identifiers';

export const SEVERITY_OPTIONS = [
  {
    id: HEALTH_INCIDENT_SEVERITY_WARNING_OPTION_UID,
    value: 'WARNING',
    label: 'Warning',
    position: 0,
    color: 'orange',
  },
  {
    id: HEALTH_INCIDENT_SEVERITY_CRITICAL_OPTION_UID,
    value: 'CRITICAL',
    label: 'Critical',
    position: 1,
    color: 'red',
  },
] as const;

export const PEAK_SEVERITY_OPTIONS = [
  {
    id: HEALTH_INCIDENT_PEAK_SEVERITY_WARNING_OPTION_UID,
    value: 'WARNING',
    label: 'Warning',
    position: 0,
    color: 'orange',
  },
  {
    id: HEALTH_INCIDENT_PEAK_SEVERITY_CRITICAL_OPTION_UID,
    value: 'CRITICAL',
    label: 'Critical',
    position: 1,
    color: 'red',
  },
] as const;

export const INCIDENT_STATUS_OPTIONS = [
  {
    id: HEALTH_INCIDENT_STATUS_PENDING_OPTION_UID,
    value: 'PENDING',
    label: 'Pending',
    position: 0,
    color: 'gray',
  },
  {
    id: HEALTH_INCIDENT_STATUS_OPEN_OPTION_UID,
    value: 'OPEN',
    label: 'Open',
    position: 1,
    color: 'orange',
  },
  {
    id: HEALTH_INCIDENT_STATUS_ACKNOWLEDGED_OPTION_UID,
    value: 'ACKNOWLEDGED',
    label: 'Acknowledged',
    position: 2,
    color: 'blue',
  },
  {
    id: HEALTH_INCIDENT_STATUS_RESOLVED_OPTION_UID,
    value: 'RESOLVED',
    label: 'Resolved',
    position: 3,
    color: 'green',
  },
] as const;

export const SNAPSHOT_STATUS_OPTIONS = [
  {
    id: HEALTH_SNAPSHOT_STATUS_OK_OPTION_UID,
    value: 'OK',
    label: 'OK',
    position: 0,
    color: 'green',
  },
  {
    id: HEALTH_SNAPSHOT_STATUS_WARNING_OPTION_UID,
    value: 'WARNING',
    label: 'Warning',
    position: 1,
    color: 'orange',
  },
  {
    id: HEALTH_SNAPSHOT_STATUS_CRITICAL_OPTION_UID,
    value: 'CRITICAL',
    label: 'Critical',
    position: 2,
    color: 'red',
  },
  {
    id: HEALTH_SNAPSHOT_STATUS_UNREACHABLE_OPTION_UID,
    value: 'UNREACHABLE',
    label: 'Unreachable',
    position: 3,
    color: 'gray',
  },
] as const;
