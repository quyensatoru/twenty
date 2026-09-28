type RateSpecialDay = {
  kind: string;
  month: number | null;
  day: number | null;
  date: string | null;
  multiplier: number;
};

// `date` is an ICT calendar day (YYYY-MM-DD). SPECIFIC days match by exact
// date, YEARLY days by month/day; the highest matching multiplier wins. Month
// and day are read from the string by position, never through `new Date(...)`,
// so the comparison stays timezone-safe.
export const resolveRateMultiplier = (
  specialDays: RateSpecialDay[],
  date: string,
): number => {
  const [, monthPart, dayPart] = date.split('-').map(Number);

  return specialDays
    .filter((specialDay) =>
      specialDay.kind === 'SPECIFIC'
        ? specialDay.date === date
        : specialDay.month === monthPart && specialDay.day === dayPart,
    )
    .reduce(
      (highestMultiplier, specialDay) =>
        Math.max(highestMultiplier, specialDay.multiplier),
      1,
    );
};
