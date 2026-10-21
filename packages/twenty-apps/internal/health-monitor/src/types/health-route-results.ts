import { type HealthDashboardData } from './health-dashboard';
import { type HealthMonitorConfig } from './health-monitor-config';
import { type HealthSnapshotStatus } from './health-snapshot-status';

export type HealthAppOverview = {
  appId: string;
  appName: string;
  canConfigure: boolean;
  monitor: {
    id: string;
    isEnabled: boolean;
    endpointUrl: string;
    intervalMinutes: number;
    snapshotRetentionHours: number;
    lastStatus: HealthSnapshotStatus | null;
    lastPolledAt: string | null;
    lastLatencyMs: number | null;
    lastError: string | null;
    nodeCount: number;
    processCount: number;
    openIncidentCount: number;
    criticalIncidentCount: number;
  } | null;
};

export type HealthOverviewResult = {
  apps: HealthAppOverview[];
  dashboardPageLayoutId: string | null;
};

export type HealthDashboardResult = {
  app: HealthAppOverview;
  dashboard: HealthDashboardData;
};

export type HealthMemberOption = {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  hasAppAccess: boolean;
};

export type HealthConfigResult = {
  appId: string;
  appName: string;
  monitorId: string | null;
  config: HealthMonitorConfig;
  members: HealthMemberOption[];
  knownNodeKeys: string[];
  knownServiceNames: string[];
};

export type HealthConnectionTestResult = {
  ok: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
  nodeCount: number;
  processCount: number;
  nodeKeys: string[];
  error: string | null;
};
