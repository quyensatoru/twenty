const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

// Counted in calendar days to the end date, as Jira's sprint header does: a
// sprint ending on the 15th has 7 days left on the 8th, and 0 on its last day.
export const computeSprintRemainingDays = ({
  endDate,
  now,
}: {
  endDate: string | null | undefined;
  now: Date;
}): { remainingDays: number; isOverdue: boolean } | null => {
  if (typeof endDate !== 'string') {
    return null;
  }

  const end = new Date(endDate);

  if (Number.isNaN(end.getTime())) {
    return null;
  }

  return {
    remainingDays: Math.max(
      0,
      Math.round((startOfLocalDay(end) - startOfLocalDay(now)) / DAY_IN_MS),
    ),
    isOverdue: end.getTime() < now.getTime(),
  };
};
