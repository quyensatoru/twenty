import {
  type HealthNodeSnapshot,
  type HealthProcessSnapshot,
} from '../types/health-snapshot-metrics';
import { readNumber } from './read-number.util';

type PayloadRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is PayloadRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNodePayload = (value: PayloadRecord): boolean =>
  isRecord(value.system) || Array.isArray(value.services);

const round = (value: number | null, digits = 2): number | null =>
  value === null ? null : Math.round(value * 10 ** digits) / 10 ** digits;

const readProcess = (value: unknown): HealthProcessSnapshot | null => {
  if (!isRecord(value) || typeof value.name !== 'string') {
    return null;
  }

  return {
    name: value.name,
    pm2Id: readNumber(value.pm2Id),
    status: typeof value.status === 'string' ? value.status : 'unknown',
    cpuPercent: round(readNumber(value.cpuPercent)),
    memoryMegabytes: round(readNumber(value.memoryMB)),
    restarts: readNumber(value.restarts),
    uptimeSeconds: round(readNumber(value.uptimeSec), 0),
  };
};

const readNode = (key: string, value: PayloadRecord): HealthNodeSnapshot => {
  const system = isRecord(value.system) ? value.system : {};
  const memory = isRecord(system.memory) ? system.memory : {};
  const disk = isRecord(system.disk) ? system.disk : {};
  const services = Array.isArray(value.services) ? value.services : [];

  return {
    key,
    host: typeof value.host === 'string' ? value.host : null,
    status: typeof value.status === 'string' ? value.status : 'unknown',
    cpuPercent: round(readNumber(system.cpuUsagePercent)),
    memoryPercent: round(readNumber(memory.usagePercent)),
    memoryUsedMegabytes: round(readNumber(memory.usedMB), 0),
    memoryTotalMegabytes: round(readNumber(memory.totalMB), 0),
    diskPercent: round(readNumber(disk.usagePercent)),
    diskUsedGigabytes: round(readNumber(disk.usedGB)),
    diskTotalGigabytes: round(readNumber(disk.totalGB)),
    uptimeSeconds: round(readNumber(value.uptimeSec), 0),
    processes: services
      .map(readProcess)
      .filter((process): process is HealthProcessSnapshot => process !== null),
  };
};

const collectDownstream = (
  downstream: unknown,
  path: string[],
  nodes: HealthNodeSnapshot[],
) => {
  if (!isRecord(downstream)) {
    return;
  }

  for (const [segment, value] of Object.entries(downstream)) {
    if (!isRecord(value)) {
      continue;
    }

    const childPath = [...path, segment];

    if (isNodePayload(value)) {
      nodes.push(readNode(childPath.join('.'), value));
      collectDownstream(value.downstream, childPath, nodes);
    } else {
      collectDownstream(value, childPath, nodes);
    }
  }
};

// The proxy answers for itself at the root and nests every node it fronts
// under `downstream.<group>.<shard>`, each with the root's own shape.
export const flattenHealthPayload = (
  payload: unknown,
): HealthNodeSnapshot[] => {
  if (!isRecord(payload)) {
    return [];
  }

  const nodes: HealthNodeSnapshot[] = [];

  if (isNodePayload(payload)) {
    const rootKey =
      typeof payload.service === 'string' && payload.service.length > 0
        ? payload.service
        : 'root';

    nodes.push(readNode(rootKey, payload));
  }

  collectDownstream(payload.downstream, [], nodes);

  return nodes;
};
