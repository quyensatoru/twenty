import { type HealthMonitorRecord } from '../types/health-monitor-record';

// Cron fires every minute; a few seconds of slack keeps a one-minute monitor
// from skipping every other run when the previous poll finished late.
const SLACK_MS = 5_000;

export const isMonitorDue = (
  monitor: Pick<
    HealthMonitorRecord,
    | 'isEnabled'
    | 'endpointUrl'
    | 'intervalMinutes'
    | 'lastPolledAt'
    | 'pollLeaseUntil'
  >,
  now: string,
): boolean => {
  const nowMs = Date.parse(now);

  if (!monitor.isEnabled || monitor.endpointUrl.length === 0) {
    return false;
  }

  if (
    monitor.pollLeaseUntil !== null &&
    Date.parse(monitor.pollLeaseUntil) > nowMs
  ) {
    return false;
  }

  return (
    monitor.lastPolledAt === null ||
    nowMs - Date.parse(monitor.lastPolledAt) >=
      monitor.intervalMinutes * 60_000 - SLACK_MS
  );
};
