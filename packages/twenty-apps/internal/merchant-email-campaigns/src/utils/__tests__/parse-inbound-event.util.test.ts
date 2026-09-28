import { describe, expect, it } from 'vitest';

import { parseInboundEvent } from '../parse-inbound-event.util';

const now = new Date('2026-09-28T10:00:00Z');

describe('parseInboundEvent', () => {
  it('reads the Brevo events body', () => {
    const result = parseInboundEvent(
      {
        event_name: 'trial_ending',
        identifiers: { email_id: 'Owner@Shop.io' },
        contact_properties: {
          DOMAIN: 'https://Shop.myshopify.com/',
          APP: 'MIDA',
          FIRSTNAME: 'Linh',
        },
        event_properties: { days_left: 3 },
      },
      now,
    );

    expect(result).toEqual({
      ok: true,
      event: {
        eventName: 'trial_ending',
        email: 'owner@shop.io',
        domain: 'shop.myshopify.com',
        appName: 'MIDA',
        contactName: 'Linh',
        occurredAt: now.toISOString(),
        contactProperties: {
          DOMAIN: 'https://Shop.myshopify.com/',
          APP: 'MIDA',
          FIRSTNAME: 'Linh',
        },
        eventProperties: { days_left: 3 },
      },
    });
  });

  it('accepts a JSON string body and an event_date', () => {
    const result = parseInboundEvent(
      JSON.stringify({
        event_name: 'x',
        contact_properties: { DOMAIN: 'a.myshopify.com' },
        event_date: '2026-01-02T03:04:05Z',
      }),
      now,
    );

    expect(result.ok && result.event.occurredAt).toBe(
      '2026-01-02T03:04:05.000Z',
    );
  });

  it('rejects missing name, missing identity and bad email', () => {
    expect(parseInboundEvent({ identifiers: { email_id: 'a@b.io' } }).ok).toBe(
      false,
    );
    expect(parseInboundEvent({ event_name: 'x' }).ok).toBe(false);
    expect(
      parseInboundEvent({ event_name: 'x', identifiers: { email_id: 'nope' } })
        .ok,
    ).toBe(false);
    expect(parseInboundEvent('not json').ok).toBe(false);
  });
});
