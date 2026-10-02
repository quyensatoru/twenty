// Timestamps come off the API as strings and a row that prints them is a fixed
// line box, so an unparsable one has to collapse to nothing rather than render
// the words "Invalid Date" and change the width of everything beside it.
export const formatDateTimeLabel = (
  value: string | null | undefined,
): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    return '';
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString();
};
