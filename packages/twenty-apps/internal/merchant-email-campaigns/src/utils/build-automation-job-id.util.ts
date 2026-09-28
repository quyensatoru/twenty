const MINUTE_MS = 60_000;

// Bucketed per minute so the duplicate events one sync run can emit for the
// same change collapse into one job. It is deliberately not a fixed
// (campaign, merchant) id even for "send once": the queue keeps finished job
// ids, so a first attempt that FAILED would block every later retry. "Send
// once" is enforced by the SENT log and Resend's idempotency key instead.
// The queue only accepts [A-Za-z0-9_.-] in ids, hence the dots.
export const buildAutomationJobId = ({
  campaignId,
  merchantId,
  trigger,
  now = Date.now(),
}: {
  campaignId: string;
  merchantId: string;
  trigger: string;
  now?: number;
}): string =>
  `${campaignId}.${merchantId}.${trigger}.${Math.floor(now / MINUTE_MS)}`;
