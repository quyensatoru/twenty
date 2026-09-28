export const readErrorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
