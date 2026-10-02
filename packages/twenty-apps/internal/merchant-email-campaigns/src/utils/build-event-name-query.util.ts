import { type MerchantTrigger } from '../types/merchant-trigger';
import { legacyTriggerForEventName } from './legacy-trigger-for-event-name.util';
import { normalizeEventName } from './normalize-event-name.util';

// The database cannot normalize, so the query casts a slightly wide net and
// selectCampaignsForEventNames narrows it: the canonical spelling, the raw
// one for rows saved before normalization, and the legacy trigger for rows
// that never got an eventName. `eq`/`in` only, never `ilike`: an event name
// is user input and `%` would silently match everything.
export const buildEventNameQuery = (
  eventNames: string[],
): { eventNames: string[]; legacyTriggers: MerchantTrigger[] } => {
  const candidates = new Set<string>();
  const legacyTriggers = new Set<MerchantTrigger>();

  for (const eventName of eventNames) {
    const normalized = normalizeEventName(eventName);

    if (normalized === null) {
      continue;
    }

    candidates.add(normalized);
    candidates.add(eventName.trim());

    const legacyTrigger = legacyTriggerForEventName(normalized);

    if (legacyTrigger !== null && legacyTrigger !== 'CUSTOM_EVENT') {
      legacyTriggers.add(legacyTrigger);
    }
  }

  return {
    eventNames: [...candidates],
    legacyTriggers: [...legacyTriggers],
  };
};
