import { describe, expect, it } from 'vitest';

import { DEFAULT_HEALTH_RULES } from '../../constants/default-health-rules';
import { evaluateHealthRules } from '../evaluate-health-rules.util';
import { flattenHealthPayload } from '../flatten-health-payload.util';
import { mergeMissingNodes } from '../merge-missing-nodes.util';
import { buildHealthPayload } from './health-payload.fixture';

const evaluate = (
  current: ReturnType<typeof buildHealthPayload>,
  previous?: ReturnType<typeof buildHealthPayload>,
) => {
  const previousNodes =
    previous === undefined ? null : flattenHealthPayload(previous);

  return evaluateHealthRules({
    nodes: mergeMissingNodes(flattenHealthPayload(current), previousNodes),
    previousNodes,
    rules: DEFAULT_HEALTH_RULES,
    mutedNodeKeys: [],
  });
};

describe('evaluateHealthRules', () => {
  it('flags hm.shard1 CPU and RAM as warnings with the default rules', () => {
    const breaches = evaluate(buildHealthPayload());

    expect(
      breaches.map((breach) => [breach.dedupeKey, breach.severity]),
    ).toEqual([
      ['hm.shard1:NODE_CPU', 'WARNING'],
      ['hm.shard1:NODE_MEMORY', 'WARNING'],
    ]);
  });

  it('raises CPU to critical above the critical threshold', () => {
    const [cpu] = evaluate(buildHealthPayload({ hmCpu: 97 }));

    expect(cpu).toMatchObject({
      dedupeKey: 'hm.shard1:NODE_CPU',
      severity: 'CRITICAL',
      threshold: 95,
    });
  });

  it('lets a scoped rule replace the default for one node', () => {
    const breaches = evaluateHealthRules({
      nodes: flattenHealthPayload(buildHealthPayload()),
      previousNodes: null,
      rules: [
        ...DEFAULT_HEALTH_RULES,
        {
          id: 'hm-cpu',
          metric: 'NODE_CPU',
          scopeNodeKey: 'hm.shard1',
          scopeServiceName: null,
          warningValue: 90,
          criticalValue: 98,
          isEnabled: true,
        },
      ],
      mutedNodeKeys: [],
    });

    expect(breaches.map((breach) => breach.dedupeKey)).toEqual([
      'hm.shard1:NODE_MEMORY',
    ]);
  });

  it('skips muted nodes', () => {
    const breaches = evaluateHealthRules({
      nodes: flattenHealthPayload(buildHealthPayload()),
      previousNodes: null,
      rules: DEFAULT_HEALTH_RULES,
      mutedNodeKeys: ['hm.shard1'],
    });

    expect(breaches).toEqual([]);
  });

  it('reports restarts since the previous poll as one event per process name', () => {
    const restarts = evaluate(
      buildHealthPayload({ apiRestarts: 10 }),
      buildHealthPayload({ apiRestarts: 9 }),
    ).filter((breach) => breach.metric === 'SERVICE_RESTARTS');

    expect(
      restarts.map((breach) => [
        breach.dedupeKey,
        breach.value,
        breach.severity,
        breach.isEvent,
      ]),
    ).toEqual([
      ['api.shard1:mida-api:SERVICE_RESTARTS', 1, 'WARNING', true],
      ['api.shard1:event.cluster:SERVICE_RESTARTS', 2, 'WARNING', true],
    ]);
  });

  it('ignores a restart counter that went down', () => {
    const breaches = evaluate(
      buildHealthPayload({ apiRestarts: 0 }),
      buildHealthPayload({ apiRestarts: 9 }),
    );

    expect(
      breaches.some((breach) => breach.metric === 'SERVICE_RESTARTS'),
    ).toBe(false);
  });

  it('flags a node status other than ok and a process that is not online', () => {
    const keys = evaluate(
      buildHealthPayload({
        hmStatus: 'degraded',
        pingProcessStatus: 'errored',
      }),
    ).map((breach) => breach.dedupeKey);

    expect(keys).toContain('hm.shard1:NODE_STATUS');
    expect(keys).toContain('ping.shard1:mida-ping#0:SERVICE_STATUS');
  });

  it('keeps a node that left the payload as a critical missing node', () => {
    const missing = evaluate(
      buildHealthPayload({ withoutPingShard2: true }),
      buildHealthPayload(),
    ).find((breach) => breach.nodeKey === 'ping.shard2');

    expect(missing).toMatchObject({
      metric: 'NODE_STATUS',
      severity: 'CRITICAL',
    });
  });
});
