const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const parseDate = (value: string | null | undefined): Date | null => {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const formatMessageTime = (value: string | null | undefined): string =>
  parseDate(value)?.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  }) ?? '';

export const readDayKey = (value: string | null | undefined): string => {
  const date = parseDate(value);

  return date === null
    ? ''
    : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

export const formatDayLabel = (
  value: string | null | undefined,
  labels: { today: string; yesterday: string },
  now: Date = new Date(),
): string => {
  const date = parseDate(value);

  if (date === null) {
    return '';
  }

  if (isSameDay(date, now)) {
    return labels.today;
  }

  if (isSameDay(date, new Date(now.getTime() - DAY_MS))) {
    return labels.yesterday;
  }

  return date.toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

// "12m", "3h", "2d": how long a customer has been waiting, short enough for a
// badge.
export const formatWaitDuration = (
  value: string | null | undefined,
  now: Date = new Date(),
): string => {
  const date = parseDate(value);

  if (date === null) {
    return '';
  }

  const elapsed = Math.max(0, now.getTime() - date.getTime());

  if (elapsed < HOUR_MS) {
    return `${Math.max(1, Math.floor(elapsed / MINUTE_MS))}m`;
  }

  if (elapsed < DAY_MS) {
    return `${Math.floor(elapsed / HOUR_MS)}h`;
  }

  return `${Math.floor(elapsed / DAY_MS)}d`;
};

export const formatRelativeTime = (
  value: string | null | undefined,
  now: Date = new Date(),
): string => {
  const date = parseDate(value);

  if (date === null) {
    return '';
  }

  const elapsed = Math.max(0, now.getTime() - date.getTime());
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (elapsed >= DAY_MS) {
    return formatter.format(-Math.floor(elapsed / DAY_MS), 'day');
  }

  if (elapsed >= HOUR_MS) {
    return formatter.format(-Math.floor(elapsed / HOUR_MS), 'hour');
  }

  if (elapsed >= MINUTE_MS) {
    return formatter.format(-Math.floor(elapsed / MINUTE_MS), 'minute');
  }

  return formatter.format(0, 'second');
};

// A date as a person reads it in a details list: the day itself, with the
// year only when it is not this one.
export const formatFriendlyDate = (
  value: string | number | null | undefined,
  now: Date = new Date(),
): string => {
  const date =
    typeof value === 'number'
      ? new Date(value > 1e12 ? value : value * 1000)
      : parseDate(value);

  if (date === null || Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const toIsoString = (value: string | number): string | null => {
  const date =
    typeof value === 'number'
      ? new Date(value > 1e12 ? value : value * 1000)
      : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
