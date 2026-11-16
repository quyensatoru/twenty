// Task dates read in the reporting timezone, the one the created-date filter
// uses, so a task near midnight shows on the day the filter counts it.
const toDate = (value: string | null | undefined): Date | null => {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const format = (
  value: string | null | undefined,
  locale: string | undefined,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): string => {
  const date = toDate(value);

  if (date === null) {
    return '—';
  }

  try {
    return date.toLocaleString(locale, { ...options, timeZone });
  } catch {
    return date.toLocaleString(locale, options);
  }
};

export const formatTaskDate = (
  value: string | null | undefined,
  locale: string | undefined,
  timeZone: string,
): string => format(value, locale, timeZone, { day: 'numeric', month: 'short', year: 'numeric' });

export const formatTaskDateTime = (
  value: string | null | undefined,
  locale: string | undefined,
  timeZone: string,
): string =>
  format(value, locale, timeZone, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
