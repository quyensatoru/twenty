import { HEALTH_METRIC_LABELS } from '../constants/health-metric-labels';
import { type HealthMetric } from '../types/health-metric';
import { formatHealthValue } from './format-health-value.util';
import { formatNodeLabel, type NodeLabels } from './format-node-label.util';
import { interpolate, type Translate } from './translate.util';

export type IncidentDescriptor = {
  metric: HealthMetric;
  nodeKey: string | null;
  serviceName: string | null;
  threshold: number | null;
  value: number | null;
};

// One wording for stored titles, the dashboard and emails. `t` is the caller's
// translator, so the same English source strings land in the locale catalogs.
export const describeIncident = (
  { metric, nodeKey, serviceName, threshold, value }: IncidentDescriptor,
  t: Translate = interpolate,
  nodeLabels: NodeLabels = {},
): string => {
  const node = nodeKey === null ? '' : formatNodeLabel(nodeKey, nodeLabels);
  const process = serviceName ?? '';
  const metricLabel = t(HEALTH_METRIC_LABELS[metric]);
  const limit = formatHealthValue(metric, threshold);

  switch (metric) {
    case 'NODE_CPU':
    case 'NODE_MEMORY':
    case 'NODE_DISK':
      return t('{node}: {metric} ≥ {threshold}', {
        node,
        metric: metricLabel,
        threshold: limit,
      });
    case 'NODE_STATUS':
      return t('{node}: down or missing from the payload', { node });
    case 'SERVICE_STATUS':
      return t('{node}: {process} is not online', { node, process });
    case 'SERVICE_MEMORY':
    case 'SERVICE_CPU':
      return t('{node}: {process} {metric} ≥ {threshold}', {
        node,
        process,
        metric: metricLabel,
        threshold: limit,
      });
    case 'SERVICE_RESTARTS':
      return t('{node}: {process} restarted {count} times', {
        node,
        process,
        count: value ?? 0,
      });
    case 'ENDPOINT_UNREACHABLE':
      return t('Health endpoint not responding ({count} failures in a row)', {
        count: value ?? 0,
      });
  }
};
