// Template variables are text, so nested values are flattened to JSON and
// null/undefined are dropped rather than rendered as "null".
export const stringifyEventProperties = (
  ...sources: unknown[]
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const source of sources) {
    if (
      typeof source !== 'object' ||
      source === null ||
      Array.isArray(source)
    ) {
      continue;
    }

    for (const [key, value] of Object.entries(source)) {
      if (value === null || value === undefined) {
        continue;
      }

      result[key] =
        typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
  }

  return result;
};
