// A route never leaks a stack trace: whatever is thrown becomes one sentence
// the front component can show.
export const readErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
