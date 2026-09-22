import { normalizeDomain } from './normalize-domain';
import { sha1, toHex } from './sha1';

// RFC 4122 v5 over the normalised domain: the id of a prospect is computable
// from the domain alone, by any writer, without a lookup. Two jobs racing on
// the same shop collide on the primary key instead of creating two rows, and a
// CSV imported before the merchant sync lands ends up on the same record.
// Changing this namespace orphans every existing prospect.
export const PROSPECT_ID_NAMESPACE = '31db4406-e2c9-47c4-9565-a5be7c012bce';

const NAMESPACE_BYTES = Uint8Array.from(
  (PROSPECT_ID_NAMESPACE.replace(/-/g, '').match(/../g) ?? []).map((pair) =>
    parseInt(pair, 16),
  ),
);

const encodeUtf8 = (value: string): Uint8Array =>
  new TextEncoder().encode(value);

export const computeProspectId = (domain: string): string | null => {
  const normalizedDomain = normalizeDomain(domain);

  if (normalizedDomain === null) {
    return null;
  }

  const domainBytes = encodeUtf8(normalizedDomain);
  const input = new Uint8Array(NAMESPACE_BYTES.length + domainBytes.length);

  input.set(NAMESPACE_BYTES);
  input.set(domainBytes, NAMESPACE_BYTES.length);

  const bytes = sha1(input).slice(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = toHex(bytes);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
};
