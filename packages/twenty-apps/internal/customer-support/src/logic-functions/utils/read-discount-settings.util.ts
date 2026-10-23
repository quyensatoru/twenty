import { kv } from 'twenty-sdk/logic-function';

import {
  DISCOUNT_SYNC_ENABLED_VARIABLE,
  getDiscountConnectionKey,
} from '../../constants/discount';

export type DiscountAppConnection = {
  endpoint: string;
  secret: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export const isDiscountSyncEnabled = (
  env: Record<string, string | undefined> = process.env,
): boolean =>
  (env[DISCOUNT_SYNC_ENABLED_VARIABLE] ?? '').trim() !== 'false';

export const readStoredDiscountConnection = async (
  appId: string,
): Promise<DiscountAppConnection | null> => {
  const stored = await kv.get<Partial<DiscountAppConnection>>(
    getDiscountConnectionKey(appId),
    { scope: 'WORKSPACE' },
  );

  return stored === null
    ? null
    : {
        endpoint: (stored.endpoint ?? '').trim(),
        secret: (stored.secret ?? '').trim(),
        updatedAt: stored.updatedAt ?? null,
        updatedBy: stored.updatedBy ?? null,
      };
};

// Usable only with both the URL and the signing secret: an unsigned delivery
// would be refused by the app anyway.
export const readDiscountAppConnection = async (
  appId: string | null | undefined,
): Promise<DiscountAppConnection | null> => {
  if (typeof appId !== 'string' || appId.length === 0) {
    return null;
  }

  const connection = await readStoredDiscountConnection(appId);

  return connection !== null &&
    connection.endpoint.length > 0 &&
    connection.secret.length > 0
    ? connection
    : null;
};

export const writeDiscountConnection = async (
  appId: string,
  connection: DiscountAppConnection,
): Promise<void> => {
  await kv.set(getDiscountConnectionKey(appId), connection, {
    scope: 'WORKSPACE',
  });
};
