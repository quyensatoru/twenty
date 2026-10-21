import { type HealthRule } from '../types/health-rule';

const rule = (
  id: string,
  metric: HealthRule['metric'],
  warningValue: number | null,
  criticalValue: number | null,
): HealthRule => ({
  id,
  metric,
  scopeNodeKey: null,
  scopeServiceName: null,
  warningValue,
  criticalValue,
  isEnabled: true,
});

export const DEFAULT_HEALTH_RULES: HealthRule[] = [
  rule('default-node-cpu', 'NODE_CPU', 80, 95),
  rule('default-node-memory', 'NODE_MEMORY', 85, 95),
  rule('default-node-disk', 'NODE_DISK', 80, 90),
  rule('default-node-status', 'NODE_STATUS', null, null),
  rule('default-service-status', 'SERVICE_STATUS', null, null),
  rule('default-service-restarts', 'SERVICE_RESTARTS', 1, 3),
  rule('default-service-memory', 'SERVICE_MEMORY', 800, 1200),
];
