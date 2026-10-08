const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const padDatePart = (value: number) => String(value).padStart(2, '0');

// Date inputs speak "YYYY-MM-DD" in the reader's own calendar. Weeks are added
// on the calendar date, so a sprint across a clock change still ends on the
// same weekday it started.
export const addWeeksToDateInput = (value: string, weeks: number): string => {
  const match = DATE_INPUT_PATTERN.exec(value);

  if (match === null) {
    return value;
  }

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );

  date.setUTCDate(date.getUTCDate() + weeks * 7);

  return `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}`;
};

// A sprint starts at the start of its first day and ends at the end of its
// last one, in the reader's time zone.
export const dateInputToIso = (
  value: string,
  edge: 'start' | 'end',
): string | null => {
  const match = DATE_INPUT_PATTERN.exec(value);

  if (match === null) {
    return null;
  }

  const date =
    edge === 'start'
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(
          Number(match[1]),
          Number(match[2]) - 1,
          Number(match[3]),
          23,
          59,
          59,
          999,
        );

  return date.toISOString();
};

export const toDateInputValue = (value: string | Date | null | undefined) => {
  if (value === null || value === undefined) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime())
    ? ''
    : `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
};
