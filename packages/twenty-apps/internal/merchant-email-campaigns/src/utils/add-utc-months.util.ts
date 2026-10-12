// Clamped so one month before March 31 is February 28, not March 3.
export const addUtcMonths = (date: Date, months: number): Date => {
  const target = new Date(date.getTime());
  const day = target.getUTCDate();

  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + months);

  const daysInTargetMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();

  target.setUTCDate(Math.min(day, daysInTargetMonth));

  return target;
};
