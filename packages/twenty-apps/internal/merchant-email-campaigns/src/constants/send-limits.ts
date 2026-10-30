// Resend accepts at most 100 messages per batch call.
export const BROADCAST_BATCH_SIZE = 100;
// QUERY_MAX_RECORDS on the server rejects larger write batches.
export const RECORD_WRITE_BATCH_SIZE = 200;
export const DEFAULT_CUSTOM_EMAIL_MAX_PER_MINUTE = 60;
// The batch job times out at 120s and still has to fetch the page and write
// the send log, so sending stops starting new attempts after this.
export const CUSTOM_EMAIL_SEND_BUDGET_MS = 90_000;
// Used when a 429 carries no Retry-After header.
export const CUSTOM_EMAIL_RATE_LIMIT_COOLDOWN_MS = 15_000;
export const CUSTOM_EMAIL_MAX_ATTEMPTS = 4;
