// "Oct 8 – Oct 22", as Jira's sprint headers show it. Null when the sprint
// has no dates yet, which a future sprint usually does not.
export const formatSprintDateRange = ({
  startDate,
  endDate,
  locale,
  timeZone,
}: {
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  locale?: string;
  timeZone?: string;
}): string | null => {
  const format = (value: string | null | undefined) => {
    if (typeof value !== 'string') {
      return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? null
      : new Intl.DateTimeFormat(locale, {
          month: 'short',
          day: 'numeric',
          timeZone,
        }).format(date);
  };
  const start = format(startDate);
  const end = format(endDate);

  if (start === null && end === null) {
    return null;
  }

  return `${start ?? '?'} – ${end ?? '?'}`;
};
