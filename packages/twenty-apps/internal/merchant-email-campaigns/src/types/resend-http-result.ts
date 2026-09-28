export type ResendHttpResult =
  | { ok: true; body: unknown }
  | { ok: false; error: string; isRetryable: boolean };
