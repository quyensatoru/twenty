import { DEFAULT_HOLIDAYS } from '../constants/default-holidays';
import { type TeamEventRow } from '../types/moments-records';

export const getMissingDefaultHolidays = (events: Pick<TeamEventRow, 'kind' | 'name' | 'date'>[]) => {
  const existingHolidays = new Set(
    events.filter((event) => event.kind === 'HOLIDAY').map((event) => `${event.name}\u0000${event.date}`),
  );

  return DEFAULT_HOLIDAYS.filter((holiday) => !existingHolidays.has(`${holiday.name}\u0000${holiday.date}`));
};
