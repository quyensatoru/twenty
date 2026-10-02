export type ActivityAnchor =
  | { kind: 'comment'; id: string }
  | { kind: 'worklog'; id: string };

const PREFIXES = [
  { prefix: 'comment-', kind: 'comment' },
  { prefix: 'worklog-', kind: 'worklog' },
] as const;

// The other half of buildIssueCommentUrl / buildIssueWorklogUrl: it writes the
// fragment, this reads it back. The fragment arrives through the execution
// context rather than `location`, which a front component's worker does not
// have.
export const parseActivityAnchor = (
  locationHash: string | null | undefined,
): ActivityAnchor | null => {
  if (typeof locationHash !== 'string') {
    return null;
  }

  // Trimmed before the separator is taken off, not after: a hash behind a space
  // is still the first character of the fragment.
  const fragment = locationHash.trim().replace(/^#/, '');

  for (const { prefix, kind } of PREFIXES) {
    if (fragment.startsWith(prefix)) {
      const id = fragment.slice(prefix.length);

      return id === '' ? null : { kind, id };
    }
  }

  return null;
};
