import { HEALTH_METRIC_UNITS } from '../constants/health-metric-labels';
import { type HealthMetric } from '../types/health-metric';

export const formatHealthValue = (
  metric: HealthMetric,
  value: number | null,
): string => {
  if (value === null) {
    return '';
  }

  return `${Number.isInteger(value) ? String(value) : value.toFixed(1)}${HEALTH_METRIC_UNITS[metric]}`;
};
