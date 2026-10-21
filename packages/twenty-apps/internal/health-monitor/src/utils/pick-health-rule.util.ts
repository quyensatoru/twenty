import { type HealthRuleMetric } from '../types/health-metric';
import { type HealthRule } from '../types/health-rule';

const specificity = (rule: HealthRule): number =>
  (rule.scopeNodeKey === null ? 0 : 2) +
  (rule.scopeServiceName === null ? 0 : 1);

// The most specific enabled rule wins, so an override on one node or one
// process replaces the default rather than adding a second alert.
export const pickHealthRule = ({
  rules,
  metric,
  nodeKey,
  serviceName,
}: {
  rules: HealthRule[];
  metric: HealthRuleMetric;
  nodeKey: string;
  serviceName: string | null;
}): HealthRule | null => {
  const matching = rules.filter(
    (rule) =>
      rule.metric === metric &&
      (rule.scopeNodeKey === null || rule.scopeNodeKey === nodeKey) &&
      (rule.scopeServiceName === null || rule.scopeServiceName === serviceName),
  );

  if (matching.length === 0) {
    return null;
  }

  const [winner] = [...matching].sort(
    (left, right) => specificity(right) - specificity(left),
  );

  return winner.isEnabled ? winner : null;
};
