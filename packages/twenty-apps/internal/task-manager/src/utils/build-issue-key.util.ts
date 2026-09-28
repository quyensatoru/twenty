export const buildIssueKey = (
  projectKey: string,
  issueNumber: number,
): string => `${projectKey}-${issueNumber}`;

// issueKey reads back as '' (not null) for a never-set TEXT column, so an
// "is defined" check alone would treat every issue as already keyed.
export const hasIssueKey = (issueKey: string | null | undefined): boolean =>
  typeof issueKey === 'string' && issueKey.length > 0;
