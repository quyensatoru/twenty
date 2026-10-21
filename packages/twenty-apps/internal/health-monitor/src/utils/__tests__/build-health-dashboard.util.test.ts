import { describe, expect, it } from 'vitest';

import { DEFAULT_HEALTH_RULES } from '../../constants/default-health-rules';
import { type HealthSnapshotRow } from '../../types/health-dashboard';
import {
  buildHealthDashboard,
  CELL_COUNT,
} from '../build-health-dashboard.util';
import { flattenHealthPayload } from '../flatten-health-payload.util';
import { buildHealthPayload } from './health-payload.fixture';

const NOW = '2026-10-21T01:30:00.000Z';

const snapshot = (
  minutesAgo: number,
  overrides: Partial<HealthSnapshotRow> = {},
  apiRestarts = 9,
): HealthSnapshotRow => ({
  polledAt: new Date(Date.parse(NOW) - minutesAgo * 60_000).toISOString(),
  status: 'WARNING',
  latencyMs: 400,
  metrics: { nodes: flattenHealthPayload(buildHealthPayload({ apiRestarts })) },
  ...overrides,
});

describe('buildHealthDashboard', () => {
  const dashboard = buildHealthDashboard({
    snapshots: [
      snapshot(30, {}, 8),
      snapshot(20, { status: 'UNREACHABLE', latencyMs: null, metrics: null }),
      snapshot(10, { latencyMs: 600 }),
      snapshot(60 * 30),
    ],
    rangeHours: 24,
    now: NOW,
    rules: DEFAULT_HEALTH_RULES,
    mutedNodeKeys: ['ping.shard2'],
    incidents: [],
  });

  it('counts polls inside the range only', () => {
    expect(dashboard.stats).toMatchObject({
      pollCount: 3,
      answeredCount: 2,
      uptimePercent: 66.67,
      latencyP95: 600,
    });
  });

  it('builds one bucket per 10 minutes over 24 hours and 48 status cells', () => {
    expect(dashboard.latency).toHaveLength(144);
    expect(dashboard.nodes[0].cells).toHaveLength(CELL_COUNT);
  });

  it('grades nodes against their thresholds', () => {
    const hm = dashboard.nodes.find((node) => node.key === 'hm.shard1');

    expect(hm).toMatchObject({
      level: 'WARNING',
      thresholds: { cpu: { warning: 80, critical: 95 } },
    });
    expect(
      dashboard.nodes.find((node) => node.key === 'ping.shard2')?.isMuted,
    ).toBe(true);
  });

  it('adds up restarts seen inside the range', () => {
    expect(dashboard.stats.restartCount).toBe(3);
  });
});
