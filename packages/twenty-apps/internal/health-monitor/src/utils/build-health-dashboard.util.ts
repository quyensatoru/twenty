import {
  type HealthDashboardData,
  type HealthDashboardNode,
  type HealthDashboardProcess,
  type HealthLevel,
  type HealthSnapshotRow,
  type HealthThreshold,
} from '../types/health-dashboard';
import { type HealthIncidentRecord } from '../types/health-incident-record';
import { type HealthRuleMetric } from '../types/health-metric';
import { type HealthRule } from '../types/health-rule';
import { type HealthNodeSnapshot } from '../types/health-snapshot-metrics';
import { buildProcessKey } from './evaluate-health-rules.util';
import { formatNodeLabel } from './format-node-label.util';
import { pickHealthRule } from './pick-health-rule.util';

const BUCKETS_BY_RANGE: Record<number, { count: number; minutes: number }> = {
  1: { count: 60, minutes: 1 },
  6: { count: 72, minutes: 5 },
  24: { count: 144, minutes: 10 },
  72: { count: 144, minutes: 30 },
  168: { count: 168, minutes: 60 },
};

export const CELL_COUNT = 48;

const LEVEL_RANK: Record<HealthLevel, number> = {
  NONE: -1,
  OK: 0,
  WARNING: 1,
  CRITICAL: 2,
};

const worse = (left: HealthLevel, right: HealthLevel): HealthLevel =>
  LEVEL_RANK[left] >= LEVEL_RANK[right] ? left : right;

export const resolveBuckets = (rangeHours: number) =>
  BUCKETS_BY_RANGE[rangeHours] ?? BUCKETS_BY_RANGE[24];

const average = (values: number[]): number | null =>
  values.length === 0
    ? null
    : Math.round(
        (values.reduce((sum, value) => sum + value, 0) / values.length) * 100,
      ) / 100;

const percentile = (values: number[], ratio: number): number | null => {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);

  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
};

const threshold = (
  rules: HealthRule[],
  metric: HealthRuleMetric,
  nodeKey: string,
): HealthThreshold => {
  const rule = pickHealthRule({ rules, metric, nodeKey, serviceName: null });

  return {
    warning: rule?.warningValue ?? null,
    critical: rule?.criticalValue ?? null,
  };
};

const levelOf = (value: number | null, limit: HealthThreshold): HealthLevel => {
  if (value === null) return 'OK';
  if (limit.critical !== null && value >= limit.critical) return 'CRITICAL';
  if (limit.warning !== null && value >= limit.warning) return 'WARNING';

  return 'OK';
};

const nodeLevel = (
  node: HealthNodeSnapshot | undefined,
  limits: HealthDashboardNode['thresholds'],
): HealthLevel => {
  if (node === undefined) {
    return 'NONE';
  }

  if (
    node.status !== 'ok' ||
    node.processes.some((process) => process.status !== 'online')
  ) {
    return 'CRITICAL';
  }

  return [
    levelOf(node.cpuPercent, limits.cpu),
    levelOf(node.memoryPercent, limits.memory),
    levelOf(node.diskPercent, limits.disk),
  ].reduce(worse, 'OK');
};

export const buildHealthDashboard = ({
  snapshots,
  rangeHours,
  now,
  rules,
  mutedNodeKeys,
  incidents,
  nodeLabels = {},
}: {
  snapshots: HealthSnapshotRow[];
  rangeHours: number;
  now: string;
  rules: HealthRule[];
  mutedNodeKeys: string[];
  incidents: HealthIncidentRecord[];
  nodeLabels?: Record<string, string>;
}): HealthDashboardData => {
  const { count, minutes } = resolveBuckets(rangeHours);
  const bucketMs = minutes * 60_000;
  const endMs = Math.ceil(Date.parse(now) / bucketMs) * bucketMs;
  const startMs = endMs - count * bucketMs;
  const inRange = snapshots
    .filter((snapshot) => {
      const at = Date.parse(snapshot.polledAt);

      return at >= startMs && at < endMs;
    })
    .sort(
      (left, right) => Date.parse(left.polledAt) - Date.parse(right.polledAt),
    );

  const bucketOf = (snapshot: HealthSnapshotRow) =>
    Math.min(
      count - 1,
      Math.floor((Date.parse(snapshot.polledAt) - startMs) / bucketMs),
    );
  const cellOf = (bucket: number) => Math.floor((bucket * CELL_COUNT) / count);

  const latencyBuckets: number[][] = Array.from({ length: count }, () => []);
  const availability: HealthLevel[] = Array.from(
    { length: count },
    () => 'NONE',
  );

  for (const snapshot of inRange) {
    const bucket = bucketOf(snapshot);
    const level: HealthLevel =
      snapshot.status === 'UNREACHABLE'
        ? 'CRITICAL'
        : snapshot.status === 'OK'
          ? 'OK'
          : snapshot.status;

    availability[bucket] = worse(availability[bucket], level);

    if (snapshot.latencyMs !== null && snapshot.status !== 'UNREACHABLE') {
      latencyBuckets[bucket].push(snapshot.latencyMs);
    }
  }

  const latest = [...inRange]
    .reverse()
    .find((snapshot) => (snapshot.metrics?.nodes ?? []).length > 0);
  const latestNodes = latest?.metrics?.nodes ?? [];
  const muted = new Set(mutedNodeKeys);
  let restartCount = 0;

  const nodes: HealthDashboardNode[] = latestNodes.map((current) => {
    const thresholds = {
      cpu: threshold(rules, 'NODE_CPU', current.key),
      memory: threshold(rules, 'NODE_MEMORY', current.key),
      disk: threshold(rules, 'NODE_DISK', current.key),
    };
    const series = {
      cpu: Array.from({ length: count }, () => [] as number[]),
      memory: Array.from({ length: count }, () => [] as number[]),
      disk: Array.from({ length: count }, () => [] as number[]),
    };
    const cells: HealthLevel[] = Array.from(
      { length: CELL_COUNT },
      () => 'NONE',
    );
    const processMemory = new Map<string, number[][]>();
    const restartsInRange = new Map<string, number>();
    const previousRestarts = new Map<string, number>();
    let seen = 0;
    let healthy = 0;

    for (const snapshot of inRange) {
      if (snapshot.status === 'UNREACHABLE') {
        continue;
      }

      const bucket = bucketOf(snapshot);
      const node = snapshot.metrics?.nodes?.find(
        (candidate) => candidate.key === current.key,
      );
      const level = nodeLevel(node, thresholds);

      cells[cellOf(bucket)] = worse(cells[cellOf(bucket)], level);
      seen += 1;

      if (node === undefined) {
        continue;
      }

      if (level !== 'CRITICAL') {
        healthy += 1;
      }

      if (node.cpuPercent !== null) series.cpu[bucket].push(node.cpuPercent);
      if (node.memoryPercent !== null)
        series.memory[bucket].push(node.memoryPercent);
      if (node.diskPercent !== null) series.disk[bucket].push(node.diskPercent);

      for (const process of node.processes) {
        const key = buildProcessKey(process);
        const memory =
          processMemory.get(key) ??
          Array.from({ length: count }, () => [] as number[]);

        if (process.memoryMegabytes !== null) {
          memory[bucket].push(process.memoryMegabytes);
        }

        processMemory.set(key, memory);

        const previous = previousRestarts.get(key);

        if (process.restarts !== null) {
          if (previous !== undefined && process.restarts > previous) {
            restartsInRange.set(
              key,
              (restartsInRange.get(key) ?? 0) + process.restarts - previous,
            );
          }

          previousRestarts.set(key, process.restarts);
        }
      }
    }

    const processes: HealthDashboardProcess[] = current.processes.map(
      (process) => {
        const key = buildProcessKey(process);
        const restarts = restartsInRange.get(key) ?? 0;

        restartCount += restarts;

        return {
          key,
          name: process.name,
          pm2Id: process.pm2Id,
          status: process.status,
          cpuPercent: process.cpuPercent,
          memoryMegabytes: process.memoryMegabytes,
          restarts: process.restarts,
          uptimeSeconds: process.uptimeSeconds,
          restartsInRange: restarts,
          memorySeries: (processMemory.get(key) ?? []).map(average),
        };
      },
    );

    return {
      key: current.key,
      label: formatNodeLabel(current.key, nodeLabels),
      host: current.host,
      level: nodeLevel(current, thresholds),
      current,
      isMuted: muted.has(current.key),
      thresholds,
      series: {
        cpu: series.cpu.map(average),
        memory: series.memory.map(average),
        disk: series.disk.map(average),
      },
      cells,
      uptimePercent:
        seen === 0 ? null : Math.round((healthy / seen) * 10_000) / 100,
      processes,
    };
  });

  const answered = inRange.filter(
    (snapshot) => snapshot.status !== 'UNREACHABLE',
  );
  const rangeIncidents = incidents.filter(
    (incident) =>
      incident.status !== 'PENDING' &&
      (incident.resolvedAt === null ||
        Date.parse(incident.resolvedAt) >= startMs),
  );

  return {
    rangeHours,
    bucketMinutes: minutes,
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    latency: latencyBuckets.map(average),
    availability,
    nodes,
    stats: {
      pollCount: inRange.length,
      answeredCount: answered.length,
      uptimePercent:
        inRange.length === 0
          ? null
          : Math.round((answered.length / inRange.length) * 10_000) / 100,
      latencyP95: percentile(
        answered
          .map((snapshot) => snapshot.latencyMs)
          .filter((value): value is number => value !== null),
        0.95,
      ),
      restartCount,
      lastStatus: inRange[inRange.length - 1]?.status ?? null,
    },
    incidents: rangeIncidents,
    nodeLabels,
  };
};
