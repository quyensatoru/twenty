import { type HealthRecipient } from './health-recipient';
import { type HealthRule } from './health-rule';
import { type HealthSnapshotMetrics } from './health-snapshot-metrics';
import { type HealthSnapshotStatus } from './health-snapshot-status';

export type HealthMonitorPolicy = {
  intervalMinutes: number;
  timeoutSeconds: number;
  openAfterBreaches: number;
  renotifyMinutes: number;
  unreachableAfterFailures: number;
  sendRecovery: boolean;
  criticalOnlyOffHours: boolean;
  snapshotRetentionHours: number;
};

export type HealthMonitorRecord = HealthMonitorPolicy & {
  id: string;
  name: string;
  appId: string | null;
  isEnabled: boolean;
  endpointUrl: string;
  headerName: string;
  headerValue: string;
  recipients: HealthRecipient[];
  extraEmails: string[];
  rules: HealthRule[];
  mutedNodeKeys: string[];
  nodeLabels: Record<string, string>;
  lastPolledAt: string | null;
  pollLeaseUntil: string | null;
  lastStatus: HealthSnapshotStatus | null;
  lastLatencyMs: number | null;
  lastError: string | null;
  consecutiveFailures: number;
  lastSnapshot: HealthSnapshotMetrics | null;
};
