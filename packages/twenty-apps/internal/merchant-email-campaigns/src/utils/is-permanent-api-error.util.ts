import { readErrorMessage } from './read-error-message.util';

// A selection or filter the workspace schema cannot answer never starts
// working, and the merchant field probe relies on failing on the first try.
const PERMANENT_ERROR_PATTERNS = [
  /does not have a field/i,
  /doesn't have any/i,
  /cannot query field/i,
  /is not defined by type/i,
  /unknown field/i,
];

export const isPermanentApiError = (error: unknown): boolean => {
  const message = readErrorMessage(error);

  return PERMANENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};
