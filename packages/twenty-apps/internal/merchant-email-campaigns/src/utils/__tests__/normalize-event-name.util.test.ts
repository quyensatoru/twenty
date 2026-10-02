import { describe, expect, it } from 'vitest';

import { normalizeEventName } from '../normalize-event-name.util';

describe('normalizeEventName', () => {
  it('folds the spellings the studio and a sender can disagree on', () => {
    expect(normalizeEventName('  Trial Ending ')).toBe('trial_ending');
    expect(normalizeEventName('TRIAL_ENDING')).toBe('trial_ending');
    expect(normalizeEventName('trial   ending')).toBe('trial_ending');
    expect(normalizeEventName('trial__ending')).toBe('trial_ending');
    expect(normalizeEventName('_trial_ending_')).toBe('trial_ending');
  });

  it('keeps the dots the built-in names use', () => {
    expect(normalizeEventName('Merchant.Installed')).toBe(
      'merchant.installed',
    );
  });

  it('treats blank and non-string values as no event', () => {
    expect(normalizeEventName('   ')).toBeNull();
    expect(normalizeEventName('')).toBeNull();
    expect(normalizeEventName('___')).toBeNull();
    expect(normalizeEventName(null)).toBeNull();
    expect(normalizeEventName(undefined)).toBeNull();
    expect(normalizeEventName(42)).toBeNull();
  });
});
