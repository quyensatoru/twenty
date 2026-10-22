const POLL_ANCHOR_PREFIX = 'poll=';

// `#poll=<id>` opens the Polls page on that specific poll. The fragment
// reaches the front component through its execution context, since the
// worker has no `location` (same mechanism as the Moments card anchor).
export const buildPollAnchor = (pollId: string): string =>
  `#${POLL_ANCHOR_PREFIX}${encodeURIComponent(pollId)}`;

export const parsePollAnchor = (locationHash: string | null | undefined): string | null => {
  const fragment = (locationHash ?? '').trim().replace(/^#/, '');

  if (!fragment.startsWith(POLL_ANCHOR_PREFIX)) {
    return null;
  }

  try {
    const pollId = decodeURIComponent(fragment.slice(POLL_ANCHOR_PREFIX.length));

    return pollId === '' ? null : pollId;
  } catch {
    return null;
  }
};
