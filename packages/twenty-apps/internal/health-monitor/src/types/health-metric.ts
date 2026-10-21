export const HEALTH_METRICS = [
  'NODE_CPU',
  'NODE_MEMORY',
  'NODE_DISK',
  'NODE_STATUS',
  'SERVICE_STATUS',
  'SERVICE_RESTARTS',
  'SERVICE_MEMORY',
  'SERVICE_CPU',
  'ENDPOINT_UNREACHABLE',
] as const;

export type HealthMetric = (typeof HEALTH_METRICS)[number];

export type HealthRuleMetric = Exclude<HealthMetric, 'ENDPOINT_UNREACHABLE'>;
