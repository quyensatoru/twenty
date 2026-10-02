import { BUILT_IN_EVENT_NAMES } from '../constants/built-in-event-names';
import { type MerchantTrigger } from '../types/merchant-trigger';
import { normalizeEventName } from './normalize-event-name.util';

// The studio keeps writing the legacy `trigger` select alongside `eventName`:
// the column is still on the Campaigns table and in saved filters, and a
// rollback to the previous release must find it routable.
export const legacyTriggerForEventName = (
  eventName: string | null | undefined,
): MerchantTrigger | null => {
  const normalized = normalizeEventName(eventName);

  if (normalized === null) {
    return null;
  }

  return (
    BUILT_IN_EVENT_NAMES.find((builtIn) => builtIn.name === normalized)
      ?.legacyTrigger ?? 'CUSTOM_EVENT'
  );
};
