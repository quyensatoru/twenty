// "1h 30m", "45m", "2h". Worklogs are entered and stored in minutes; this is
// only the display form.
export const formatMinutes = (minutes: number | null | undefined): string => {
  if (typeof minutes !== 'number' || minutes <= 0) {
    return '0m';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return remainingMinutes === 0
    ? `${hours}h`
    : `${hours}h ${remainingMinutes}m`;
};

// Accepts "90", "1h30m", "1h 30", "2h", "45m". Returns null when nothing
// numeric is present, so the caller can refuse the submit instead of logging
// zero minutes.
export const parseMinutes = (input: string): number | null => {
  const trimmed = input.trim().toLowerCase();

  if (trimmed === '') {
    return null;
  }

  const hourAndMinute = /^(\d+)\s*h(?:\s*(\d+)\s*m?)?$/.exec(trimmed);

  if (hourAndMinute !== null) {
    return (
      Number(hourAndMinute[1]) * 60 + Number(hourAndMinute[2] ?? 0)
    );
  }

  const minutesOnly = /^(\d+)\s*m?$/.exec(trimmed);

  return minutesOnly === null ? null : Number(minutesOnly[1]);
};
