import { type HealthNodeSnapshot } from '../types/health-snapshot-metrics';

export const MISSING_NODE_STATUS = 'missing';

// A node that drops out of the payload is kept as `missing` in every later
// snapshot, so its incident stays open until it answers again instead of
// resolving on the next poll. Muting the node is how a retired one goes away.
export const mergeMissingNodes = (
  nodes: HealthNodeSnapshot[],
  previousNodes: HealthNodeSnapshot[] | null,
): HealthNodeSnapshot[] => {
  const currentKeys = new Set(nodes.map((node) => node.key));
  const missing = (previousNodes ?? [])
    .filter((node) => !currentKeys.has(node.key))
    .map((node) => ({
      ...node,
      status: MISSING_NODE_STATUS,
      cpuPercent: null,
      memoryPercent: null,
      diskPercent: null,
      uptimeSeconds: null,
      processes: [],
    }));

  return [...nodes, ...missing];
};
