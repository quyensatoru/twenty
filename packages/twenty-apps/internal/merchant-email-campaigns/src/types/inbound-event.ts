export type InboundEvent = {
  eventName: string;
  email: string | null;
  domain: string | null;
  appName: string | null;
  contactName: string | null;
  occurredAt: string;
  contactProperties: Record<string, unknown>;
  eventProperties: Record<string, unknown>;
};
