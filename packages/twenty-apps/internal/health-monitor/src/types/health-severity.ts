export type HealthSeverity = 'WARNING' | 'CRITICAL';

export const HEALTH_SEVERITY_RANK: Record<HealthSeverity, number> = {
  WARNING: 1,
  CRITICAL: 2,
};
