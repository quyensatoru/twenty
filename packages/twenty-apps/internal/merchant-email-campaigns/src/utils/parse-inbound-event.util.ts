import { type InboundEventParseResult } from '../types/inbound-event-parse-result';
import { isValidEmail } from './is-valid-email.util';
import { normalizeShopDomain } from './normalize-shop-domain.util';
import { safeJsonParse } from './safe-json-parse.util';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};

const readText = (record: UnknownRecord, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return null;
};

// Accepts the body of Brevo's POST /v3/events, so a sender that already
// talks to Brevo only swaps the URL and key:
//   { event_name, event_date?, identifiers: { email_id },
//     contact_properties: { DOMAIN, APP?, FIRSTNAME? }, event_properties? }
// Property names are matched case-insensitively on the common spellings.
export const parseInboundEvent = (
  body: unknown,
  now: Date = new Date(),
): InboundEventParseResult => {
  const record = asRecord(
    typeof body === 'string' ? safeJsonParse(body) : body,
  );
  const eventName = readText(record, ['event_name', 'eventName']);

  if (eventName === null) {
    return { ok: false, error: 'event_name is required.' };
  }

  if (eventName.length > 255) {
    return { ok: false, error: 'event_name is longer than 255 characters.' };
  }

  const identifiers = asRecord(record.identifiers);
  const contactProperties = asRecord(record.contact_properties);
  const eventProperties = asRecord(record.event_properties);
  const email =
    readText(identifiers, ['email_id', 'email'])?.toLowerCase() ?? null;

  if (email !== null && !isValidEmail(email)) {
    return { ok: false, error: 'identifiers.email_id is not a valid email.' };
  }

  const domain = normalizeShopDomain(
    readText(contactProperties, ['DOMAIN', 'domain', 'SHOP_DOMAIN']) ??
      readText(identifiers, ['ext_id']),
  );

  if (email === null && domain === null) {
    return {
      ok: false,
      error:
        'Send identifiers.email_id or contact_properties.DOMAIN to identify the merchant.',
    };
  }

  const eventDate = readText(record, ['event_date', 'eventDate']);
  const parsedDate = eventDate === null ? null : new Date(eventDate);

  return {
    ok: true,
    event: {
      eventName,
      email,
      domain,
      appName: readText(contactProperties, ['APP', 'APP_NAME', 'app']),
      contactName: readText(contactProperties, [
        'FIRSTNAME',
        'CONTACT_NAME',
        'firstName',
      ]),
      occurredAt:
        parsedDate !== null && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toISOString()
          : now.toISOString(),
      contactProperties,
      eventProperties,
    },
  };
};
