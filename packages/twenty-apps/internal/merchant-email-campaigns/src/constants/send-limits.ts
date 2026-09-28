// Resend accepts at most 100 messages per batch call.
export const BROADCAST_BATCH_SIZE = 100;
// QUERY_MAX_RECORDS on the server rejects larger write batches.
export const RECORD_WRITE_BATCH_SIZE = 200;
