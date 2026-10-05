// The server throttles every API call an app makes: APPLICATION_API_RATE_LIMITING_LIMIT
// (500 by default) per APPLICATION_API_RATE_LIMITING_TTL_IN_MS (60s), keyed by
// the application, not by the function. The cron and all seven database
// triggers therefore draw on one shared budget, and a burst that empties it
// makes every other function of the app fail too. Pacing well under the cap is
// what keeps the cron from starving the triggers.
const REQUESTS_PER_WINDOW = 360;
const WINDOW_MS = 60_000;
const MIN_INTERVAL_MS = Math.ceil(WINDOW_MS / REQUESTS_PER_WINDOW);

let nextSlotAt = 0;

export const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// Returns how long it waited, for tests and for the run summary.
export const waitForRequestSlot = async (): Promise<number> => {
  const now = Date.now();
  const slotAt = Math.max(now, nextSlotAt);

  nextSlotAt = slotAt + MIN_INTERVAL_MS;

  const waitMs = slotAt - now;

  if (waitMs > 0) {
    await delay(waitMs);
  }

  return waitMs;
};

export const resetRequestPacing = (): void => {
  nextSlotAt = 0;
};

export const requestPacingIntervalMs = MIN_INTERVAL_MS;
