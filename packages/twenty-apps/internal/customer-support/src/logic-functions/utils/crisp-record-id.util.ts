import { createHash } from 'node:crypto';

// RFC 4122 v5 over a Crisp identity, so the web hook, the sync job and a
// retried delivery all compute the same record id without a lookup, and two
// writers racing on one message collide on the primary key instead of
// creating two rows. Changing this namespace orphans every synced record.
const CRISP_RECORD_ID_NAMESPACE = 'a8f53c2e-6f5e-4d8b-9d0c-3c7b1e2f4a61';

const computeUuidV5 = (name: string): string => {
  const namespaceBytes = Buffer.from(
    CRISP_RECORD_ID_NAMESPACE.replace(/-/g, ''),
    'hex',
  );
  const bytes = createHash('sha1')
    .update(namespaceBytes)
    .update(name, 'utf8')
    .digest()
    .subarray(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
};

export const computeCrispConversationId = ({
  websiteId,
  sessionId,
}: {
  websiteId: string;
  sessionId: string;
}): string => computeUuidV5(`conversation:${websiteId}:${sessionId}`);

export const computeCrispMessageId = ({
  websiteId,
  sessionId,
  fingerprint,
}: {
  websiteId: string;
  sessionId: string;
  fingerprint: string;
}): string => computeUuidV5(`message:${websiteId}:${sessionId}:${fingerprint}`);
