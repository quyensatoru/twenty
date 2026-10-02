const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
// Past a month a day count tells a reader less than the date does.
const ABSOLUTE_AFTER_MS = 30 * DAY_MS;

// What the feed prints under every row, and what the host's own record header
// prints beside the title, so the two read as one page.
//
// Intl localises the whole phrase, so this is "3 days ago" under an English
// locale and "3 ngày trước" under a Vietnamese one without the app carrying a
// message per unit.
export const formatRelativeTimeLabel = (
  value: string | null | undefined,
  now: Date = new Date(),
): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    return '';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  // Clamped, because a browser clock a few seconds ahead of the server's would
  // otherwise print "in 2 seconds" on a comment just posted.
  const elapsedMs = Math.max(0, now.getTime() - parsed.getTime());

  if (elapsedMs >= ABSOLUTE_AFTER_MS) {
    return parsed.toLocaleDateString();
  }

  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: 'auto',
  });

  if (elapsedMs >= DAY_MS) {
    return formatter.format(-Math.floor(elapsedMs / DAY_MS), 'day');
  }

  if (elapsedMs >= HOUR_MS) {
    return formatter.format(-Math.floor(elapsedMs / HOUR_MS), 'hour');
  }

  if (elapsedMs >= MINUTE_MS) {
    return formatter.format(-Math.floor(elapsedMs / MINUTE_MS), 'minute');
  }

  return formatter.format(0, 'second');
};
