import { isNonEmptyString } from '@sniptt/guards';

type PinnableIssue = {
  id: string;
  pinnedAt?: string | null;
};

// The board as it looks right after a pin or an unpin, before the server
// confirms it. Columns keep the board's order, so moving a newly pinned issue
// to the front puts it on top of its own column. An unpinned issue stays put:
// where it belongs under the sort is only known to the server.
export const toggleBoardIssuePin = <TIssue extends PinnableIssue>(
  issues: readonly TIssue[],
  issueId: string,
  now: string,
): { issues: TIssue[]; pinnedAt: string | null } | null => {
  const issue = issues.find((candidate) => candidate.id === issueId);

  if (issue === undefined) {
    return null;
  }

  const pinnedAt = isNonEmptyString(issue.pinnedAt) ? null : now;
  const toggledIssue = { ...issue, pinnedAt };

  return {
    pinnedAt,
    issues:
      pinnedAt === null
        ? issues.map((candidate) =>
            candidate.id === issueId ? toggledIssue : candidate,
          )
        : [
            toggledIssue,
            ...issues.filter((candidate) => candidate.id !== issueId),
          ],
  };
};
