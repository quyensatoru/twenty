import { type HealthRuleMetric } from './health-metric';

// warningValue / criticalValue are ignored by the status metrics, which only
// ever raise CRITICAL. A scoped rule replaces the unscoped one for the nodes
// and services it names.
export type HealthRule = {
  id: string;
  metric: HealthRuleMetric;
  scopeNodeKey: string | null;
  scopeServiceName: string | null;
  warningValue: number | null;
  criticalValue: number | null;
  isEnabled: boolean;
};
