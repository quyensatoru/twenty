import { type HealthIncidentStatus } from './health-incident-status';
import { type HealthMetric } from './health-metric';
import { type HealthSeverity } from './health-severity';

export type HealthIncidentRecord = {
  id: string;
  monitorId: string | null;
  title: string;
  dedupeKey: string;
  nodeKey: string | null;
  host: string | null;
  serviceName: string | null;
  metric: HealthMetric;
  severity: HealthSeverity;
  peakSeverity: HealthSeverity;
  status: HealthIncidentStatus;
  breachCount: number;
  lastValue: number | null;
  peakValue: number | null;
  threshold: number | null;
  firstBreachAt: string | null;
  openedAt: string | null;
  resolvedAt: string | null;
  lastNotifiedAt: string | null;
  notifyCount: number;
  acknowledgedByMemberId: string | null;
  acknowledgedAt: string | null;
};
