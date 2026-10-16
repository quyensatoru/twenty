const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type DueDateHint = {
  direction: 'upcoming' | 'overdue';
  days: number;
};

// Counted in calendar days, not 24-hour spans: a date due tomorrow morning is
// "tomorrow" at 11 PM tonight. Today, tomorrow and yesterday get no hint,
// because the due label already says them in words.
export const readDueDateHint = (
  value: string | null | undefined,
  now: Date = new Date(),
): DueDateHint | null => {
  if (typeof value !== 'string' || value === '') {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);
  const deltaDays = Math.round(
    (target.getTime() - today.getTime()) / DAY_IN_MS,
  );

  if (Math.abs(deltaDays) < 2) {
    return null;
  }

  return deltaDays > 0
    ? { direction: 'upcoming', days: deltaDays }
    : { direction: 'overdue', days: -deltaDays };
};
