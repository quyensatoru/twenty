export const readShortDate = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string' || value === '') {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
};

// Overdue from the start of today: a task due earlier today is not late yet.
export const readIsOverdue = (
  value: string | null | undefined,
  isDone: boolean,
): boolean => {
  if (isDone || typeof value !== 'string' || value === '') {
    return false;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsed.getTime() < today.getTime();
};
