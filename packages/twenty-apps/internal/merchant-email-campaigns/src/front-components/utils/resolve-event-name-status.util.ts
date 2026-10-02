import { type EventNameSuggestion } from '../../types/event-name-suggestion';
import { findClosestEventName } from '../../utils/find-closest-event-name.util';
import { normalizeEventName } from '../../utils/normalize-event-name.util';

export type EventNameStatus =
  | { kind: 'EMPTY' }
  | { kind: 'BUILT_IN' }
  | { kind: 'RECEIVED'; receivedCount: number; lastReceivedAt: string | null }
  | { kind: 'BOUND_ONLY'; automationCount: number }
  | { kind: 'UNKNOWN'; closestEventName: string | null };

// Without a fixed list the only way a typo shows up is by comparing what was
// typed against what the events API has actually received. UNKNOWN is not an
// error — a brand new event legitimately has no history — but it is the state
// the composer has to look at before activating.
export const resolveEventNameStatus = (
  eventName: string,
  suggestions: EventNameSuggestion[],
): EventNameStatus => {
  const normalized = normalizeEventName(eventName);

  if (normalized === null) {
    return { kind: 'EMPTY' };
  }

  const match = suggestions.find(
    (suggestion) => suggestion.name === normalized,
  );

  if (match?.isBuiltIn === true) {
    return { kind: 'BUILT_IN' };
  }

  if (match !== undefined && match.receivedCount > 0) {
    return {
      kind: 'RECEIVED',
      receivedCount: match.receivedCount,
      lastReceivedAt: match.lastReceivedAt,
    };
  }

  if (match !== undefined && match.automationCount > 0) {
    return { kind: 'BOUND_ONLY', automationCount: match.automationCount };
  }

  return {
    kind: 'UNKNOWN',
    closestEventName: findClosestEventName(
      normalized,
      suggestions.map((suggestion) => suggestion.name),
    ),
  };
};
