// releaseDate is a calendar date with no zone; parsing it as UTC midnight
// and formatting in UTC keeps it from shifting a day west of Greenwich.
const parseCalendarDate = (value: string | null | undefined): Date | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}(-\d{2})?/.test(value)) {
    return null;
  }

  const [year, month, day = '01'] = value.slice(0, 10).split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatReleaseDate = (
  value: string | null | undefined,
  locale: string,
): string =>
  parseCalendarDate(value)?.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }) ?? '';

export const formatReleaseMonth = (monthKey: string, locale: string): string =>
  parseCalendarDate(monthKey)?.toLocaleDateString(locale, {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }) ?? monthKey;

export const formatReleaseTimestamp = (
  value: string | null | undefined,
  locale: string,
): string => {
  if (typeof value !== 'string' || value === '') {
    return '';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
};

export const readTodayCalendarDate = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
};
