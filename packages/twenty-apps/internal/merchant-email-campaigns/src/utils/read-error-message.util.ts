export const readErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  const candidate = error as
    { message?: unknown; errors?: { message?: unknown }[] } | null | undefined;

  if (typeof candidate?.message === 'string') {
    return candidate.message;
  }

  const nested = candidate?.errors?.[0]?.message;

  return typeof nested === 'string' ? nested : String(error);
};
