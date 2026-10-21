import { type HealthMetric } from './health-metric';
import { type HealthSeverity } from './health-severity';

export type HealthBreach = {
  dedupeKey: string;
  title: string;
  nodeKey: string | null;
  host: string | null;
  serviceName: string | null;
  metric: HealthMetric;
  severity: HealthSeverity;
  value: number | null;
  threshold: number | null;
  // Restarts and an unreachable endpoint are already confirmed when seen: the
  // consecutive-poll count is what the failure counter or the delta measured.
  opensImmediately: boolean;
  // A restart is an event, not a state: it is reported once and closed.
  isEvent: boolean;
};
