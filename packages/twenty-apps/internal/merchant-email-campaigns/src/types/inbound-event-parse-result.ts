import { type InboundEvent } from './inbound-event';

export type InboundEventParseResult =
  { ok: true; event: InboundEvent } | { ok: false; error: string };
