// Remaining estimate is derived, never entered: what is left of the original
// estimate after logged time, floored at zero. Null when no original estimate
// was given, matching the fork's recomputation.
export const computeRemainingEstimateMinutes = ({
  originalEstimateMinutes,
  timeSpentMinutes,
}: {
  originalEstimateMinutes: number | null | undefined;
  timeSpentMinutes: number;
}): number | null =>
  typeof originalEstimateMinutes === 'number'
    ? Math.max(originalEstimateMinutes - timeSpentMinutes, 0)
    : null;
