const ID_KEYS = ['id', 'messageId', 'MessageId', 'message_id'];

// In-house services answer in their own shape; the first id-like field is
// kept so a send can be traced in the provider's logs.
export const readProviderMessageId = (body: unknown): string => {
  if (typeof body !== 'object' || body === null) {
    return '';
  }

  const record = body as Record<string, unknown>;

  for (const key of ID_KEYS) {
    if (typeof record[key] === 'string' || typeof record[key] === 'number') {
      return String(record[key]);
    }
  }

  return typeof record.data === 'object'
    ? readProviderMessageId(record.data)
    : '';
};
