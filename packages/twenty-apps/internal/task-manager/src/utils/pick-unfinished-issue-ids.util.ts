type IssueRow = { id: string; statusId?: string | null };

// "Unfinished" is what a sprint leaves behind when it closes. The fork's SQL
// compared `status != 'DONE'` against the old SELECT column; `issue.status` is
// now a relation to a per-project issueStatus, so the DONE set is the statuses
// whose CATEGORY is DONE. An issue with no status at all counts as unfinished.
export const pickUnfinishedIssueIds = ({
  issues,
  doneStatusIds,
}: {
  issues: readonly IssueRow[];
  doneStatusIds: readonly string[];
}): string[] => {
  const doneStatusIdSet = new Set(doneStatusIds);

  return issues
    .filter(
      (issue) =>
        typeof issue.statusId !== 'string' ||
        !doneStatusIdSet.has(issue.statusId),
    )
    .map((issue) => issue.id);
};
