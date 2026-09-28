// <input type="datetime-local"> works in local time without a zone suffix.
export const toDatetimeLocalValue = (
  isoDate: string | null | undefined,
): string => {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};
