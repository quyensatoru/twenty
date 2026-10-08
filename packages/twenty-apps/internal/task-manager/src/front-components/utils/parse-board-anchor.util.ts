import { type BoardViewMode } from '../../types/task-board';

// The other half of the board deep link: the modal copies
// `<board path>#issue-<id>`, this reads the fragment back so opening that URL
// lands on the board with the issue's modal already open. The fragment arrives
// through the execution context rather than `location`, which a front
// component's worker does not have.
export const parseBoardIssueAnchor = (
  locationHash: string | null | undefined,
): string | null => {
  if (typeof locationHash !== 'string') {
    return null;
  }

  // Trimmed before the separator is taken off, not after: a hash behind a
  // space is still the first character of the fragment.
  const fragment = locationHash.trim().replace(/^#/, '');

  if (!fragment.startsWith('issue-')) {
    return null;
  }

  const issueId = fragment.slice('issue-'.length);

  return issueId === '' ? null : issueId;
};

// `#backlog` opens the page on the backlog, so a link can point at either
// view. Anything else leaves the choice to what the reader last used.
export const parseBoardViewAnchor = (
  locationHash: string | null | undefined,
): BoardViewMode | null => {
  if (typeof locationHash !== 'string') {
    return null;
  }

  const fragment = locationHash.trim().replace(/^#/, '');

  return fragment === 'backlog' ? 'backlog' : fragment === 'board' ? 'board' : null;
};
