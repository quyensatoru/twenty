export const requireString = (value: unknown, name: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing ${name}.`);
  }

  return value.trim();
};
