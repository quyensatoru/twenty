import { describe, expect, it } from 'vitest';

import { buildEventNameSuggestions } from '../build-event-name-suggestions.util';
import { findClosestEventName } from '../find-closest-event-name.util';
import { legacyTriggerForEventName } from '../legacy-trigger-for-event-name.util';

describe('buildEventNameSuggestions', () => {
  it('always offers the events the app raises itself', () => {
    expect(
      buildEventNameSuggestions({ receivedEvents: [], campaigns: [] }).map(
        (suggestion) => suggestion.name,
      ),
    ).toEqual([
      'merchant.installed',
      'merchant.uninstalled',
      'merchant.shopify_plan_changed',
      'merchant.pricing_plan_changed',
      'merchant.unsubscribed',
      'merchant.contact_changed',
      'merchant.email_changed',
    ]);
  });

  it('counts an event the API received under one canonical name', () => {
    const [received] = buildEventNameSuggestions({
      receivedEvents: [
        { name: 'trial_ending', occurredAt: '2026-09-01T00:00:00Z' },
        { name: 'Trial Ending', occurredAt: '2026-09-09T00:00:00Z' },
      ],
      campaigns: [],
    }).filter((suggestion) => !suggestion.isBuiltIn);

    expect(received).toMatchObject({
      name: 'trial_ending',
      receivedCount: 2,
      lastReceivedAt: '2026-09-09T00:00:00Z',
    });
  });

  it('offers an event only a campaign knows about, so a typo is listable', () => {
    const suggestions = buildEventNameSuggestions({
      receivedEvents: [],
      campaigns: [
        {
          campaignType: 'AUTOMATION',
          status: 'ACTIVE',
          eventName: 'trail_ending',
        },
      ],
    });
    const typo = suggestions.find(
      (suggestion) => suggestion.name === 'trail_ending',
    );

    expect(typo).toMatchObject({ automationCount: 1, receivedCount: 0 });
  });
});

describe('findClosestEventName', () => {
  it('spots a one-letter miss', () => {
    expect(
      findClosestEventName('trail_ending', ['trial_ending', 'feature_used']),
    ).toBe('trial_ending');
  });

  it('stays quiet on an exact match and on an unrelated new name', () => {
    expect(findClosestEventName('trial_ending', ['trial_ending'])).toBeNull();
    expect(findClosestEventName('checkout_abandoned', ['trial_ending'])).toBe(
      null,
    );
  });
});

describe('legacyTriggerForEventName', () => {
  it('maps the built-ins back and calls everything else a custom event', () => {
    expect(legacyTriggerForEventName('merchant.installed')).toBe('INSTALLED');
    expect(legacyTriggerForEventName('trial_ending')).toBe('CUSTOM_EVENT');
    expect(legacyTriggerForEventName('  ')).toBeNull();
  });
});
