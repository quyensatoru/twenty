import { type HealthMetric } from '../types/health-metric';

// English source strings; callers translate them.
export const HEALTH_METRIC_LABELS: Record<HealthMetric, string> = {
  NODE_CPU: 'Node CPU',
  NODE_MEMORY: 'Node RAM',
  NODE_DISK: 'Disk',
  NODE_STATUS: 'Node status',
  SERVICE_STATUS: 'Process status',
  SERVICE_RESTARTS: 'Process restarts',
  SERVICE_MEMORY: 'Process RAM',
  SERVICE_CPU: 'Process CPU',
  ENDPOINT_UNREACHABLE: 'Endpoint unreachable',
};

export const HEALTH_METRIC_UNITS: Record<HealthMetric, string> = {
  NODE_CPU: '%',
  NODE_MEMORY: '%',
  NODE_DISK: '%',
  NODE_STATUS: '',
  SERVICE_STATUS: '',
  SERVICE_RESTARTS: '',
  SERVICE_MEMORY: ' MB',
  SERVICE_CPU: '%',
  ENDPOINT_UNREACHABLE: '',
};
