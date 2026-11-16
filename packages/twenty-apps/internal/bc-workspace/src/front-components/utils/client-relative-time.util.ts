const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

export const formatRelativeTime = (
  value: string | null | undefined,
  locale?: string,
  now: number = Date.now(),
): string => {
  if (typeof value !== 'string') {
    return '—';
  }

  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return '—';
  }

  const elapsed = time - now;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const [unit, size] of UNITS) {
    if (Math.abs(elapsed) >= size) {
      return formatter.format(Math.round(elapsed / size), unit);
    }
  }

  return formatter.format(0, 'minute');
};
