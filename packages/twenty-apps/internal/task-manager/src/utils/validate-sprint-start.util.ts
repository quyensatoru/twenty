export type SprintStartProblem =
  | 'NOT_FUTURE'
  | 'ANOTHER_ACTIVE'
  | 'NO_ISSUES'
  | 'MISSING_DATES'
  | 'END_BEFORE_START';

const parseTime = (value: unknown): number | null => {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const time = Date.parse(value);

  return Number.isNaN(time) ? null : time;
};

// A sprint with no state predates the field's FUTURE default, so it counts as
// future rather than becoming impossible to start.
export const validateSprintStart = ({
  state,
  issueCount,
  otherActiveSprintCount,
  startDate,
  endDate,
}: {
  state: string | null | undefined;
  issueCount: number;
  otherActiveSprintCount: number;
  startDate: unknown;
  endDate: unknown;
}): SprintStartProblem | null => {
  if ((state ?? 'FUTURE') !== 'FUTURE') {
    return 'NOT_FUTURE';
  }

  if (otherActiveSprintCount > 0) {
    return 'ANOTHER_ACTIVE';
  }

  if (issueCount === 0) {
    return 'NO_ISSUES';
  }

  const startTime = parseTime(startDate);
  const endTime = parseTime(endDate);

  if (startTime === null || endTime === null) {
    return 'MISSING_DATES';
  }

  return endTime > startTime ? null : 'END_BEFORE_START';
};
