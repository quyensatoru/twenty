// Consecutive messages from one person a few minutes apart read as one
// message: the later ones drop the avatar and the name, as chat tools do.
export const FEED_GROUPING_WINDOW_MS = 5 * 60_000;

type GroupableFeedItem = {
  authorId?: string | null;
  timestamp?: string | null;
};

const readTimestamp = (value: string | null | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? null : parsed;
};

// Compared in either direction, so a newest-first list groups the same pairs
// as an oldest-first one.
export const isGroupedFeedItem = (
  previous: GroupableFeedItem | undefined,
  current: GroupableFeedItem,
): boolean => {
  if (
    previous === undefined ||
    typeof current.authorId !== 'string' ||
    previous.authorId !== current.authorId
  ) {
    return false;
  }

  const previousTime = readTimestamp(previous.timestamp);
  const currentTime = readTimestamp(current.timestamp);

  return (
    previousTime !== null &&
    currentTime !== null &&
    Math.abs(currentTime - previousTime) <= FEED_GROUPING_WINDOW_MS
  );
};
