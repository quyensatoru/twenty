export type UsageDecision = 'NONE' | 'UPSELL' | 'ESCALATE';

export const UPSELL_USAGE_RATIO = 0.8;

export const readUsageRatio = (used: number, limit: number): number | null =>
  Number.isFinite(used) && Number.isFinite(limit) && limit > 0
    ? used / limit
    : null;

// 80% of the allowance opens the opportunity, 100% escalates the same one;
// below 80% the threshold rule does nothing.
export const decideUsageThreshold = (used: number, limit: number): UsageDecision => {
  const ratio = readUsageRatio(used, limit);

  if (ratio === null || ratio < UPSELL_USAGE_RATIO) {
    return 'NONE';
  }

  return ratio >= 1 ? 'ESCALATE' : 'UPSELL';
};
