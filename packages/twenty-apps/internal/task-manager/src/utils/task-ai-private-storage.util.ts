import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from 'node:crypto';
import { kv } from 'twenty-sdk/logic-function';

const readSecret = () => {
  const secret = process.env.TASK_AI_STORAGE_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret))
    throw new Error(
      'Configure Task AI storage secret with 32 random bytes encoded as hex.',
    );
  return Buffer.from(secret, 'hex');
};
const storageKey = (key: string) =>
  `task-ai-private:${createHmac('sha256', readSecret()).update(key).digest('hex')}`;
export const taskAiPrivateStorage = {
  get: async <TValue>(key: string): Promise<TValue | null> => {
    const stored = await kv.get<string>(storageKey(key));
    if (stored === null) return null;
    const [nonce, tag, content] = stored.split('.');
    if (!nonce || !tag || !content)
      throw new Error('Private conversation storage is invalid.');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      createHash('sha256').update(readSecret()).digest(),
      Buffer.from(nonce, 'hex'),
    );
    decipher.setAAD(Buffer.from(key));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    return JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(content, 'hex')),
        decipher.final(),
      ]).toString('utf8'),
    ) as TValue;
  },
  set: async <TValue>(key: string, value: TValue): Promise<void> => {
    const nonce = randomBytes(12);
    const cipher = createCipheriv(
      'aes-256-gcm',
      createHash('sha256').update(readSecret()).digest(),
      nonce,
    );
    cipher.setAAD(Buffer.from(key));
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final(),
    ]);
    await kv.set(
      storageKey(key),
      `${nonce.toString('hex')}.${cipher.getAuthTag().toString('hex')}.${encrypted.toString('hex')}`,
    );
  },
  delete: async (key: string) => kv.delete(storageKey(key)),
};
