const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

const readOffsetMs = (instantMs: number, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instantMs));
  const read = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return (
    Date.UTC(
      read('year'),
      read('month') - 1,
      read('day'),
      read('hour'),
      read('minute'),
      read('second'),
    ) -
    (instantMs - (instantMs % 1000))
  );
};

export const isDateOnly = (value: unknown): value is string =>
  typeof value === 'string' && DATE_PATTERN.test(value);

// Midnight of a calendar day in the reporting timezone, as a UTC instant.
// Re-reading the offset at the first guess handles days that start inside a
// daylight-saving change.
export const readZonedDayStart = (date: string, timeZone: string): string => {
  const match = DATE_PATTERN.exec(date);

  if (match === null) {
    throw new Error(`Invalid date ${date}.`);
  }

  const wallClockMs = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  const firstGuess = wallClockMs - readOffsetMs(wallClockMs, timeZone);

  return new Date(
    wallClockMs - readOffsetMs(firstGuess, timeZone),
  ).toISOString();
};

export const shiftDate = (date: string, days: number): string => {
  const match = DATE_PATTERN.exec(date);

  if (match === null) {
    return date;
  }

  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) +
      days * DAY_MS,
  )
    .toISOString()
    .slice(0, 10);
};

export const readZonedDate = (instantMs: number, timeZone: string): string =>
  new Date(instantMs + readOffsetMs(instantMs, timeZone))
    .toISOString()
    .slice(0, 10);

// Inclusive From/To days become a half-open UTC window [start, end).
export const buildCreatedRange = ({
  from,
  to,
  timeZone,
}: {
  from: string | null;
  to: string | null;
  timeZone: string;
}): { gte: string | null; lt: string | null } => ({
  gte: isDateOnly(from) ? readZonedDayStart(from, timeZone) : null,
  lt: isDateOnly(to) ? readZonedDayStart(shiftDate(to, 1), timeZone) : null,
});
