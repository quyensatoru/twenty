// The issues a backlog section ranks among: the project's top-level issues in
// one sprint, or in none. Subtasks are not ranked; they follow their parent.
export const buildRankSectionFilter = ({
  projectId,
  sprintId,
  excludedIssueId,
}: {
  projectId: string;
  sprintId: string | null;
  excludedIssueId: string;
}): Record<string, unknown> => ({
  projectId: { eq: projectId },
  parentId: { is: 'NULL' },
  sprintId: sprintId === null ? { is: 'NULL' } : { eq: sprintId },
  id: { neq: excludedIssueId },
});
