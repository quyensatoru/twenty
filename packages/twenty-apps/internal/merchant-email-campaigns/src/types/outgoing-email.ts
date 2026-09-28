export type OutgoingEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
  // Values a custom HTTP provider's body template can reference, such as the
  // shop domain and campaign name, which Resend itself has no field for.
  context?: Record<string, string>;
};
