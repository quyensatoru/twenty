import { type TaskTodayWindow } from '../../types/task-today';
import { addTaskTodayDays } from '../../utils/task-today-date.util';
import { dateInputToIso, toDateInputValue } from './sprint-dates.util';

// Due dates are timestamps. Browser-local midnights preserve the reader's
// calendar, including weeks that cross a daylight-saving change.
export const getTaskTodayWindow = (
  now: Date = new Date(),
): TaskTodayWindow & { day: string } => {
  const day = toDateInputValue(now);
  return {
    day,
    startOfDay: dateInputToIso(day, 'start') as string,
    nextDay: dateInputToIso(addTaskTodayDays(day, 1), 'start') as string,
    upcomingEnd: dateInputToIso(addTaskTodayDays(day, 8), 'start') as string,
  };
};
