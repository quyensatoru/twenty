const ICT_OFFSET_MILLIS = 7 * 60 * 60 * 1000;

// Team Moments counts days in Vietnam time, whatever the browser time zone.
export const getTeamMomentsTodayIsoDate = (now: Date): string =>
  new Date(now.getTime() + ICT_OFFSET_MILLIS).toISOString().slice(0, 10);
