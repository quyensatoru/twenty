import { DEFAULT_HEALTH_RULES } from '../../constants/default-health-rules';
import {
  DEFAULT_HEADER_NAME,
  DEFAULT_MONITOR_POLICY,
} from '../../constants/health-options';
import { type ApiClient } from '../../types/api-client';
import { type HealthMonitorRecord } from '../../types/health-monitor-record';
import { type HealthRecipient } from '../../types/health-recipient';
import { type HealthRule } from '../../types/health-rule';
import { type HealthSnapshotMetrics } from '../../types/health-snapshot-metrics';
import { type HealthSnapshotStatus } from '../../types/health-snapshot-status';
import { listAllRecords } from './list-all-records.util';

export const HEALTH_MONITOR_SELECTION = {
  id: true,
  name: true,
  appId: true,
  isEnabled: true,
  endpointUrl: true,
  headerName: true,
  headerValue: true,
  intervalMinutes: true,
  timeoutSeconds: true,
  openAfterBreaches: true,
  renotifyMinutes: true,
  unreachableAfterFailures: true,
  sendRecovery: true,
  criticalOnlyOffHours: true,
  snapshotRetentionHours: true,
  recipients: true,
  extraEmails: true,
  rules: true,
  mutedNodeKeys: true,
  nodeLabels: true,
  lastPolledAt: true,
  pollLeaseUntil: true,
  lastStatus: true,
  lastLatencyMs: true,
  lastError: true,
  consecutiveFailures: true,
  lastSnapshot: true,
};

type MonitorNode = Record<string, unknown>;

const readArray = <TItem>(value: unknown, fallback: TItem[] = []): TItem[] =>
  Array.isArray(value) ? (value as TItem[]) : fallback;

const readNumberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const readStringMap = (value: unknown): Record<string, string> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        ),
      )
    : {};

const readStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

export const toHealthMonitorRecord = (
  node: MonitorNode,
): HealthMonitorRecord => {
  const snapshot = node.lastSnapshot as
    | HealthSnapshotMetrics
    | null
    | undefined;

  return {
    id: String(node.id),
    name: typeof node.name === 'string' ? node.name : '',
    appId: readStringOrNull(node.appId),
    isEnabled: node.isEnabled === true,
    endpointUrl: typeof node.endpointUrl === 'string' ? node.endpointUrl : '',
    headerName:
      typeof node.headerName === 'string' && node.headerName.length > 0
        ? node.headerName
        : DEFAULT_HEADER_NAME,
    headerValue: typeof node.headerValue === 'string' ? node.headerValue : '',
    intervalMinutes: readNumberOr(
      node.intervalMinutes,
      DEFAULT_MONITOR_POLICY.intervalMinutes,
    ),
    timeoutSeconds: readNumberOr(
      node.timeoutSeconds,
      DEFAULT_MONITOR_POLICY.timeoutSeconds,
    ),
    openAfterBreaches: readNumberOr(
      node.openAfterBreaches,
      DEFAULT_MONITOR_POLICY.openAfterBreaches,
    ),
    renotifyMinutes: readNumberOr(
      node.renotifyMinutes,
      DEFAULT_MONITOR_POLICY.renotifyMinutes,
    ),
    unreachableAfterFailures: readNumberOr(
      node.unreachableAfterFailures,
      DEFAULT_MONITOR_POLICY.unreachableAfterFailures,
    ),
    sendRecovery: node.sendRecovery !== false,
    criticalOnlyOffHours: node.criticalOnlyOffHours === true,
    snapshotRetentionHours: readNumberOr(
      node.snapshotRetentionHours,
      DEFAULT_MONITOR_POLICY.snapshotRetentionHours,
    ),
    recipients: readArray<HealthRecipient>(node.recipients),
    extraEmails: readArray<string>(node.extraEmails),
    // A monitor saved before any rule edit has no rules stored yet.
    rules: Array.isArray(node.rules)
      ? (node.rules as HealthRule[])
      : DEFAULT_HEALTH_RULES,
    mutedNodeKeys: readArray<string>(node.mutedNodeKeys),
    nodeLabels: readStringMap(node.nodeLabels),
    lastPolledAt: readStringOrNull(node.lastPolledAt),
    pollLeaseUntil: readStringOrNull(node.pollLeaseUntil),
    lastStatus: readStringOrNull(
      node.lastStatus,
    ) as HealthSnapshotStatus | null,
    lastLatencyMs:
      typeof node.lastLatencyMs === 'number' ? node.lastLatencyMs : null,
    lastError: readStringOrNull(node.lastError),
    consecutiveFailures: readNumberOr(node.consecutiveFailures, 0),
    lastSnapshot:
      snapshot !== null &&
      typeof snapshot === 'object' &&
      Array.isArray(snapshot.nodes)
        ? snapshot
        : null,
  };
};

export const listHealthMonitors = async ({
  client,
  filter,
}: {
  client: ApiClient;
  filter?: Record<string, unknown>;
}): Promise<HealthMonitorRecord[]> =>
  (
    await listAllRecords<MonitorNode>({
      client,
      pluralName: 'healthMonitors',
      filter,
      selection: HEALTH_MONITOR_SELECTION,
    })
  ).map(toHealthMonitorRecord);

export const findHealthMonitor = async ({
  client,
  monitorId,
}: {
  client: ApiClient;
  monitorId: string;
}): Promise<HealthMonitorRecord> => {
  const [monitor] = await listHealthMonitors({
    client,
    filter: { id: { eq: monitorId } },
  });

  if (monitor === undefined) {
    throw new Error('Monitor not found.');
  }

  return monitor;
};

export const updateHealthMonitor = async ({
  client,
  monitorId,
  data,
}: {
  client: ApiClient;
  monitorId: string;
  data: Record<string, unknown>;
}): Promise<void> => {
  await client.mutation({
    updateHealthMonitor: { __args: { id: monitorId, data }, id: true },
  });
};
