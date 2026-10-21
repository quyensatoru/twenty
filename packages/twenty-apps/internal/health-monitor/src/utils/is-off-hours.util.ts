import { WORKING_HOURS } from '../constants/health-options';

export const isOffHours = (now: string): boolean => {
  const local = new Date(
    Date.parse(now) + WORKING_HOURS.timeZoneOffsetMinutes * 60_000,
  );
  const hour = local.getUTCHours();

  return hour < WORKING_HOURS.startHour || hour >= WORKING_HOURS.endHour;
};
