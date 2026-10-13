export const readErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  const nested = (error as { errors?: { message?: unknown }[] } | null)
    ?.errors?.[0]?.message;

  return typeof nested === 'string' ? nested : 'Unexpected error';
};
