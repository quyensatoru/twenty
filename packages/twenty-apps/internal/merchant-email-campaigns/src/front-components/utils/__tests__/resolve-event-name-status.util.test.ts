import { describe, expect, it } from 'vitest';

import { type EventNameSuggestion } from '../../../types/event-name-suggestion';
import { resolveEventNameStatus } from '../resolve-event-name-status.util';

const suggestion = (
  overrides: Partial<EventNameSuggestion>,
): EventNameSuggestion => ({
  name: 'trial_ending',
  label: 'trial_ending',
  isBuiltIn: false,
  receivedCount: 0,
  lastReceivedAt: null,
  automationCount: 0,
  ...overrides,
});

describe('resolveEventNameStatus', () => {
  it('asks for an event when nothing is typed', () => {
    expect(resolveEventNameStatus('  ', [])).toEqual({ kind: 'EMPTY' });
  });

  it('confirms an event the API has received', () => {
    expect(
      resolveEventNameStatus('Trial Ending', [
        suggestion({ receivedCount: 3, lastReceivedAt: '2026-09-09' }),
      ]),
    ).toEqual({
      kind: 'RECEIVED',
      receivedCount: 3,
      lastReceivedAt: '2026-09-09',
    });
  });

  it('flags a typo with the name it is one letter from', () => {
    expect(
      resolveEventNameStatus('trail_ending', [
        suggestion({ receivedCount: 1 }),
      ]),
    ).toEqual({ kind: 'UNKNOWN', closestEventName: 'trial_ending' });
  });

  it('says a never-received name is waiting on the sender, not on a typo', () => {
    expect(
      resolveEventNameStatus('trial_ending', [
        suggestion({ automationCount: 2 }),
      ]),
    ).toEqual({ kind: 'BOUND_ONLY', automationCount: 2 });
  });
});
