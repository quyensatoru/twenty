export type EmailSendResult =
  { ok: true; id: string } | { ok: false; error: string; isRetryable: boolean };
