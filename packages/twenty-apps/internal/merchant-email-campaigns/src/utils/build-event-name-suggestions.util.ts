import { BUILT_IN_EVENT_NAMES } from '../constants/built-in-event-names';
import { type CampaignRow } from '../types/campaign-row';
import { type EventNameSuggestion } from '../types/event-name-suggestion';
import { normalizeEventName } from './normalize-event-name.util';
import { resolveCampaignEventName } from './resolve-campaign-event-name.util';

// There is no fixed list of events any more, so the catalogue is derived:
// the names the events API has actually received, the names automations are
// already bound to, and the four the app emits itself. An automation bound to
// a name with receivedCount 0 that is not built-in is the typo signal.
export const buildEventNameSuggestions = ({
  receivedEvents,
  campaigns,
}: {
  receivedEvents: { name: string | null; occurredAt: string | null }[];
  campaigns: Pick<CampaignRow, 'campaignType' | 'status' | 'trigger' | 'eventName'>[];
}): EventNameSuggestion[] => {
  const byName = new Map<string, EventNameSuggestion>();
  const upsert = (name: string, label: string, isBuiltIn: boolean) => {
    const existing = byName.get(name);

    if (existing !== undefined) {
      return existing;
    }

    const created: EventNameSuggestion = {
      name,
      label,
      isBuiltIn,
      receivedCount: 0,
      lastReceivedAt: null,
      automationCount: 0,
    };

    byName.set(name, created);

    return created;
  };

  for (const builtIn of BUILT_IN_EVENT_NAMES) {
    upsert(builtIn.name, builtIn.label, true);
  }

  for (const receivedEvent of receivedEvents) {
    const name = normalizeEventName(receivedEvent.name);

    if (name === null) {
      continue;
    }

    const suggestion = upsert(name, name, false);

    suggestion.receivedCount += 1;

    if (
      receivedEvent.occurredAt !== null &&
      (suggestion.lastReceivedAt === null ||
        receivedEvent.occurredAt > suggestion.lastReceivedAt)
    ) {
      suggestion.lastReceivedAt = receivedEvent.occurredAt;
    }
  }

  for (const campaign of campaigns) {
    const name = resolveCampaignEventName(campaign);

    if (name === null || campaign.campaignType !== 'AUTOMATION') {
      continue;
    }

    upsert(name, name, false).automationCount += 1;
  }

  const builtInPosition = (name: string) =>
    BUILT_IN_EVENT_NAMES.findIndex((builtIn) => builtIn.name === name);

  return [...byName.values()].sort((left, right) => {
    if (left.isBuiltIn !== right.isBuiltIn) {
      return left.isBuiltIn ? -1 : 1;
    }

    if (left.isBuiltIn && right.isBuiltIn) {
      return builtInPosition(left.name) - builtInPosition(right.name);
    }

    return (
      right.receivedCount - left.receivedCount ||
      left.name.localeCompare(right.name)
    );
  });
};
