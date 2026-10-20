const CARD_ANCHOR_PREFIX = 'card=';

// `#card=<occurrence key>` opens the Moments page on that occasion's shared
// card. The fragment reaches the front component through its execution
// context, since the worker has no `location`.
export const buildMomentsCardAnchor = (occurrenceKey: string): string =>
  `#${CARD_ANCHOR_PREFIX}${encodeURIComponent(occurrenceKey)}`;

export const parseMomentsCardAnchor = (locationHash: string | null | undefined): string | null => {
  const fragment = (locationHash ?? '').trim().replace(/^#/, '');

  if (!fragment.startsWith(CARD_ANCHOR_PREFIX)) {
    return null;
  }

  try {
    const occurrenceKey = decodeURIComponent(fragment.slice(CARD_ANCHOR_PREFIX.length));

    return occurrenceKey === '' ? null : occurrenceKey;
  } catch {
    return null;
  }
};
