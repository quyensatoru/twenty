// Retry-After is either a number of seconds or an HTTP date.
export const parseRetryAfter = (
  header: string | null,
  now: number = Date.now(),
): number | undefined => {
  if (header === null || header.trim() === '') {
    return undefined;
  }

  const seconds = Number(header);

  if (Number.isFinite(seconds)) {
    return seconds >= 0 ? seconds * 1000 : undefined;
  }

  const date = Date.parse(header);

  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
};
