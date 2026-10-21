import { type HealthRule } from '../types/health-rule';
import { type HealthSeverity } from '../types/health-severity';

export const gradeValue = (
  value: number | null,
  rule: Pick<HealthRule, 'warningValue' | 'criticalValue'>,
): { severity: HealthSeverity; threshold: number } | null => {
  if (value === null) {
    return null;
  }

  if (rule.criticalValue !== null && value >= rule.criticalValue) {
    return { severity: 'CRITICAL', threshold: rule.criticalValue };
  }

  if (rule.warningValue !== null && value >= rule.warningValue) {
    return { severity: 'WARNING', threshold: rule.warningValue };
  }

  return null;
};
