export const fromDatetimeLocalValue = (value: string): string | null => {
  if (value.trim() === '') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
