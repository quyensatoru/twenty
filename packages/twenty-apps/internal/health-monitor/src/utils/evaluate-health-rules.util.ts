import { type HealthBreach } from '../types/health-breach';
import { type HealthRuleMetric } from '../types/health-metric';
import { type HealthRule } from '../types/health-rule';
import {
  type HealthNodeSnapshot,
  type HealthProcessSnapshot,
} from '../types/health-snapshot-metrics';
import { describeIncident } from './describe-incident.util';
import { gradeValue } from './grade-value.util';
import { pickHealthRule } from './pick-health-rule.util';

type EvaluateInput = {
  nodes: HealthNodeSnapshot[];
  previousNodes: HealthNodeSnapshot[] | null;
  rules: HealthRule[];
  mutedNodeKeys: string[];
};

const NODE_THRESHOLD_METRICS: {
  metric: HealthRuleMetric;
  read: (node: HealthNodeSnapshot) => number | null;
}[] = [
  { metric: 'NODE_CPU', read: (node) => node.cpuPercent },
  { metric: 'NODE_MEMORY', read: (node) => node.memoryPercent },
  { metric: 'NODE_DISK', read: (node) => node.diskPercent },
];

const PROCESS_THRESHOLD_METRICS: {
  metric: HealthRuleMetric;
  read: (process: HealthProcessSnapshot) => number | null;
}[] = [
  { metric: 'SERVICE_MEMORY', read: (process) => process.memoryMegabytes },
  { metric: 'SERVICE_CPU', read: (process) => process.cpuPercent },
];

export const buildProcessKey = (
  process: Pick<HealthProcessSnapshot, 'name' | 'pm2Id'>,
): string => `${process.name}#${process.pm2Id ?? '-'}`;

const stateBreach = (
  breach: Omit<HealthBreach, 'opensImmediately' | 'isEvent' | 'title'>,
): HealthBreach => ({
  ...breach,
  title: describeIncident(breach),
  opensImmediately: false,
  isEvent: false,
});

const evaluateRestarts = ({
  node,
  previousNode,
  rules,
}: {
  node: HealthNodeSnapshot;
  previousNode: HealthNodeSnapshot | undefined;
  rules: HealthRule[];
}): HealthBreach[] => {
  if (previousNode === undefined) {
    return [];
  }

  const previousByKey = new Map(
    previousNode.processes.map((process) => [
      buildProcessKey(process),
      process,
    ]),
  );
  const restartsByName = new Map<string, number>();

  for (const process of node.processes) {
    const previous = previousByKey.get(buildProcessKey(process));

    // A lower count means pm2 itself was restarted and reset its counters.
    if (
      previous?.restarts == null ||
      process.restarts === null ||
      process.restarts <= previous.restarts
    ) {
      continue;
    }

    restartsByName.set(
      process.name,
      (restartsByName.get(process.name) ?? 0) +
        process.restarts -
        previous.restarts,
    );
  }

  const breaches: HealthBreach[] = [];

  for (const [serviceName, delta] of restartsByName) {
    const rule = pickHealthRule({
      rules,
      metric: 'SERVICE_RESTARTS',
      nodeKey: node.key,
      serviceName,
    });
    const grade = rule === null ? null : gradeValue(delta, rule);

    if (grade === null) {
      continue;
    }

    breaches.push({
      dedupeKey: `${node.key}:${serviceName}:SERVICE_RESTARTS`,
      title: describeIncident({
        metric: 'SERVICE_RESTARTS',
        nodeKey: node.key,
        serviceName,
        threshold: grade.threshold,
        value: delta,
      }),
      nodeKey: node.key,
      host: node.host,
      serviceName,
      metric: 'SERVICE_RESTARTS',
      severity: grade.severity,
      value: delta,
      threshold: grade.threshold,
      opensImmediately: true,
      isEvent: true,
    });
  }

  return breaches;
};

export const evaluateHealthRules = ({
  nodes,
  previousNodes,
  rules,
  mutedNodeKeys,
}: EvaluateInput): HealthBreach[] => {
  const muted = new Set(mutedNodeKeys);
  const previousByKey = new Map(
    (previousNodes ?? []).map((node) => [node.key, node]),
  );
  const breaches: HealthBreach[] = [];

  for (const node of nodes) {
    if (muted.has(node.key)) {
      continue;
    }

    for (const { metric, read } of NODE_THRESHOLD_METRICS) {
      const rule = pickHealthRule({
        rules,
        metric,
        nodeKey: node.key,
        serviceName: null,
      });
      const value = read(node);
      const grade = rule === null ? null : gradeValue(value, rule);

      if (grade !== null) {
        breaches.push(
          stateBreach({
            dedupeKey: `${node.key}:${metric}`,
            nodeKey: node.key,
            host: node.host,
            serviceName: null,
            metric,
            severity: grade.severity,
            value,
            threshold: grade.threshold,
          }),
        );
      }
    }

    if (
      node.status !== 'ok' &&
      pickHealthRule({
        rules,
        metric: 'NODE_STATUS',
        nodeKey: node.key,
        serviceName: null,
      }) !== null
    ) {
      breaches.push(
        stateBreach({
          dedupeKey: `${node.key}:NODE_STATUS`,
          nodeKey: node.key,
          host: node.host,
          serviceName: null,
          metric: 'NODE_STATUS',
          severity: 'CRITICAL',
          value: null,
          threshold: null,
        }),
      );
    }

    for (const process of node.processes) {
      const processKey = buildProcessKey(process);

      if (
        process.status !== 'online' &&
        pickHealthRule({
          rules,
          metric: 'SERVICE_STATUS',
          nodeKey: node.key,
          serviceName: process.name,
        }) !== null
      ) {
        breaches.push(
          stateBreach({
            dedupeKey: `${node.key}:${processKey}:SERVICE_STATUS`,
            nodeKey: node.key,
            host: node.host,
            serviceName: process.name,
            metric: 'SERVICE_STATUS',
            severity: 'CRITICAL',
            value: null,
            threshold: null,
          }),
        );
      }

      for (const { metric, read } of PROCESS_THRESHOLD_METRICS) {
        const rule = pickHealthRule({
          rules,
          metric,
          nodeKey: node.key,
          serviceName: process.name,
        });
        const value = read(process);
        const grade = rule === null ? null : gradeValue(value, rule);

        if (grade !== null) {
          breaches.push(
            stateBreach({
              dedupeKey: `${node.key}:${processKey}:${metric}`,
              nodeKey: node.key,
              host: node.host,
              serviceName: process.name,
              metric,
              severity: grade.severity,
              value,
              threshold: grade.threshold,
            }),
          );
        }
      }
    }

    breaches.push(
      ...evaluateRestarts({
        node,
        previousNode: previousByKey.get(node.key),
        rules,
      }),
    );
  }

  return breaches;
};
