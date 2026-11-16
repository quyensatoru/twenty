import { randomUUID } from 'node:crypto';
import { kv } from 'twenty-sdk/logic-function';

type Lease = { token: string; until: number };

const DEFAULT_LEASE_MS = 60_000;

// kv has no expiry or compare-and-set, so a lock is a lease with its own
// deadline: an expired lease is free, and a writer re-reads its token to
// lose ties. Good enough to stop two jobs of one client from both opening
// an issue; a stuck holder frees itself when the lease runs out.
export const acquireClientLock = async (
  name: string,
  leaseMs = DEFAULT_LEASE_MS,
): Promise<string | null> => {
  const key = `bc-lock:${name}`;
  const current = await kv.get<Lease>(key);

  if (current !== null && current.until > Date.now()) {
    return null;
  }

  const token = randomUUID();

  await kv.set<Lease>(key, { token, until: Date.now() + leaseMs });

  const confirmed = await kv.get<Lease>(key);

  return confirmed?.token === token ? token : null;
};

export const releaseClientLock = async (name: string, token: string): Promise<void> => {
  const key = `bc-lock:${name}`;
  const current = await kv.get<Lease>(key);

  if (current?.token === token) {
    await kv.delete(key);
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// For HTTP routes, which cannot re-queue themselves: wait briefly, then let
// the caller retry.
export const withClientLock = async <TResult>(
  name: string,
  run: () => Promise<TResult>,
  { attempts = 8, delayMs = 400 }: { attempts?: number; delayMs?: number } = {},
): Promise<TResult> => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const token = await acquireClientLock(name);

    if (token !== null) {
      try {
        return await run();
      } finally {
        await releaseClientLock(name, token);
      }
    }

    await sleep(delayMs);
  }

  throw new Error('This client is being updated by another event. Retry the call.');
};
