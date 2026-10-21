export const INTERVAL_MINUTE_OPTIONS = [1, 2, 5, 10] as const;
export const TIMEOUT_SECOND_OPTIONS = [5, 10, 20] as const;
export const RETENTION_HOUR_OPTIONS = [6, 24, 72, 168] as const;

export const DEFAULT_HEADER_NAME = 'x-health-secret-key';

export const DEFAULT_MONITOR_POLICY = {
  intervalMinutes: 1,
  timeoutSeconds: 10,
  openAfterBreaches: 2,
  renotifyMinutes: 60,
  unreachableAfterFailures: 3,
  sendRecovery: true,
  criticalOnlyOffHours: false,
  snapshotRetentionHours: 24,
} as const;

// Vietnam keeps no daylight saving, so a fixed offset is exact.
export const WORKING_HOURS = {
  timeZoneOffsetMinutes: 7 * 60,
  startHour: 8,
  endHour: 19,
} as const;
