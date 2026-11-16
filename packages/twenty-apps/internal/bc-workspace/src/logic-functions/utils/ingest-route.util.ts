import { timingSafeEqual } from 'node:crypto';

import { type ApiClient } from '../../types/api-client';
import { type VipClientRecord } from '../../types/bc-records';
import { findVipClientByShopDomain } from './automation-records.util';
import { createAppClient } from './create-app-client.util';
import { readBcSettings } from './read-bc-settings.util';
import { readErrorMessage } from './read-error-message.util';

export const INGEST_SECRET_HEADER = 'x-bc-ingest-secret';

const isSameSecret = (expected: string, received: string | undefined): boolean => {
  if (typeof received !== 'string') {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received.trim(), 'utf8');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

export type IngestRouteEvent<TBody> = {
  body?: TBody | null;
  headers?: Record<string, string | undefined>;
};

export const requireIngestString = (value: unknown, name: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing ${name}.`);
  }

  return value.trim();
};

export const requireIngestNumber = (value: unknown, name: string): number => {
  const number = typeof value === 'string' ? Number(value) : value;

  if (typeof number !== 'number' || !Number.isFinite(number)) {
    throw new Error(`Missing or invalid ${name}.`);
  }

  return number;
};

export const requireIngestDate = (value: unknown, name: string): string => {
  const text = requireIngestString(value, name);
  const time = Date.parse(text);

  if (Number.isNaN(time)) {
    throw new Error(`Invalid ${name}: expected an ISO 8601 date.`);
  }

  return new Date(time).toISOString();
};

// The workspace API key authenticates the caller; the shared secret, once set,
// also proves the call comes from one of the BSS systems.
export const runIngestRoute = async <TBody extends { shopDomain?: string }>(
  event: IngestRouteEvent<TBody>,
  run: (context: {
    client: ApiClient;
    body: TBody;
    vipClient: VipClientRecord;
  }) => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> => {
  try {
    const { ingestSecret } = readBcSettings();

    if (
      ingestSecret.length > 0 &&
      !isSameSecret(ingestSecret, event.headers?.[INGEST_SECRET_HEADER])
    ) {
      return { success: false, error: 'Invalid ingest secret.' };
    }

    const body = (event.body ?? {}) as TBody;
    const shopDomain = requireIngestString(body.shopDomain, 'shopDomain');
    const client = createAppClient();
    const vipClient = await findVipClientByShopDomain(client, shopDomain);

    if (vipClient === null) {
      return { success: true, ignored: 'not a VIP client' };
    }

    return { success: true, ...(await run({ client, body, vipClient })) };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};
