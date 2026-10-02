import { BUILT_IN_EVENT_NAMES } from '../constants/built-in-event-names';

// Campaigns created before events became data carry the routing key in the
// `trigger` select and leave `eventName` empty. Routing reads them through
// here, so the backfill is a cleanup rather than a prerequisite for deploy.
export const eventNameForLegacyTrigger = (
  trigger: string | null | undefined,
): string | null =>
  BUILT_IN_EVENT_NAMES.find((builtIn) => builtIn.legacyTrigger === trigger)
    ?.name ?? null;
