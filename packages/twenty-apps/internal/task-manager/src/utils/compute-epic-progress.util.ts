// The roadmap reads progress off the issues' statuses: an issue counts as done
// when its status sits in the DONE category, which is per-project data rather
// than a hardcoded value as in the original SELECT field.
export const computeEpicProgress = ({
  issues,
  doneStatusIds,
}: {
  issues: readonly { statusId?: string | null }[];
  doneStatusIds: readonly string[];
}): { doneCount: number; totalCount: number; percentage: number } => {
  const doneStatusIdSet = new Set(doneStatusIds);
  const doneCount = issues.filter(
    (issue) =>
      typeof issue.statusId === 'string' && doneStatusIdSet.has(issue.statusId),
  ).length;

  return {
    doneCount,
    totalCount: issues.length,
    percentage:
      issues.length === 0 ? 0 : Math.round((doneCount / issues.length) * 100),
  };
};
