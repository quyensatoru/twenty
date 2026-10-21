import { type HealthIncidentRecord } from './health-incident-record';
import { type HealthNodeSnapshot } from './health-snapshot-metrics';
import { type HealthSnapshotStatus } from './health-snapshot-status';

export type HealthLevel = 'OK' | 'WARNING' | 'CRITICAL' | 'NONE';

export type HealthThreshold = {
  warning: number | null;
  critical: number | null;
};

export type HealthDashboardProcess = {
  key: string;
  name: string;
  pm2Id: number | null;
  status: string;
  cpuPercent: number | null;
  memoryMegabytes: number | null;
  restarts: number | null;
  uptimeSeconds: number | null;
  restartsInRange: number;
  memorySeries: (number | null)[];
};

export type HealthDashboardNode = {
  key: string;
  label: string;
  host: string | null;
  level: HealthLevel;
  current: HealthNodeSnapshot;
  isMuted: boolean;
  thresholds: {
    cpu: HealthThreshold;
    memory: HealthThreshold;
    disk: HealthThreshold;
  };
  series: {
    cpu: (number | null)[];
    memory: (number | null)[];
    disk: (number | null)[];
  };
  cells: HealthLevel[];
  uptimePercent: number | null;
  processes: HealthDashboardProcess[];
};

export type HealthDashboardData = {
  rangeHours: number;
  bucketMinutes: number;
  startAt: string;
  endAt: string;
  latency: (number | null)[];
  availability: HealthLevel[];
  nodes: HealthDashboardNode[];
  stats: {
    pollCount: number;
    answeredCount: number;
    uptimePercent: number | null;
    latencyP95: number | null;
    restartCount: number;
    lastStatus: HealthSnapshotStatus | null;
  };
  incidents: HealthIncidentRecord[];
  nodeLabels: Record<string, string>;
};

export type HealthSnapshotRow = {
  polledAt: string;
  status: HealthSnapshotStatus;
  latencyMs: number | null;
  metrics: { nodes?: HealthNodeSnapshot[] } | null;
};
