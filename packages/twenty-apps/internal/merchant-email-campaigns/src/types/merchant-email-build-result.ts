import { type OutgoingEmail } from './outgoing-email';

export type MerchantEmailBuildResult =
  | { kind: 'READY'; email: OutgoingEmail; subject: string; to: string }
  | { kind: 'SKIPPED'; reason: string; to: string };
