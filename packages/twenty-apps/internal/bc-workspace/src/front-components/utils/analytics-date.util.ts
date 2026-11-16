// Analytics filters by days of the reporting timezone, so its tables show
// dates in that timezone too; a row near midnight then reads as inside the
// range it was counted in, whatever the browser's timezone.
export const formatReportingDate = (
  value: string | null | undefined,
  locale: string,
  timezone: string,
): string => {
  if (typeof value !== 'string' || value.length === 0) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  try {
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: timezone,
    });
  } catch {
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
};

const escapeCsvValue = (value: string): string =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export const buildCsv = (header: string[], rows: string[][]): string =>
  [header, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
