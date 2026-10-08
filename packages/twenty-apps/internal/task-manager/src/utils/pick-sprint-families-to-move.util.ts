type SprintIssue = {
  id: string;
  statusId?: string | null;
  parentId?: string | null;
};

const findHeadIssue = (
  issue: SprintIssue,
  issuesById: Map<string, SprintIssue>,
): SprintIssue => {
  const visitedIds = new Set<string>([issue.id]);
  let head = issue;

  while (typeof head.parentId === 'string') {
    const parent = issuesById.get(head.parentId);

    if (parent === undefined || visitedIds.has(parent.id)) {
      break;
    }

    visitedIds.add(parent.id);
    head = parent;
  }

  return head;
};

// Completing a sprint moves whole families, as Jira does: a top-level issue
// that is not done leaves with every subtask it has in the sprint, and a done
// one keeps its subtasks with it in the closed sprint. A subtask whose parent
// is not in the sprint is judged on its own status. "Done" is a status in the
// project's DONE category; an issue with no status is unfinished.
export const pickSprintFamiliesToMove = ({
  issues,
  doneStatusIds,
}: {
  issues: readonly SprintIssue[];
  doneStatusIds: readonly string[];
}): string[] => {
  const doneStatusIdSet = new Set(doneStatusIds);
  const issuesById = new Map(issues.map((issue) => [issue.id, issue]));

  return issues
    .filter((issue) => {
      const head = findHeadIssue(issue, issuesById);

      return (
        typeof head.statusId !== 'string' || !doneStatusIdSet.has(head.statusId)
      );
    })
    .map((issue) => issue.id);
};
