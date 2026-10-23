export const requireString = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing ${label}.`);
  }

  return value.trim();
};
