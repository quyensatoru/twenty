// Jira-style issue keys: an uppercase project prefix, a dash, a number.
// Branch names, commit messages and MR titles carry them (`PROJ-123`), and the
// webhook resolves each one onto its issue.
const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]+-\d+\b/g;

// Every key a free-form text mentions, uppercased and deduped in order of
// appearance. Case-insensitive on purpose: `proj-123` in a branch name still
// means PROJ-123.
export const extractIssueKeys = (value: unknown): string[] => {
  if (typeof value !== 'string' || value.length === 0) {
    return [];
  }

  const matches = value.toUpperCase().match(ISSUE_KEY_PATTERN);

  return matches === null ? [] : [...new Set(matches)];
};
