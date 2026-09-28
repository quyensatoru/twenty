import { type ApiClient } from '../../types/api-client';
import { executeWithRetry } from '../../utils/execute-with-retry.util';
import { readUnsubscribeSecret } from './read-unsubscribe-secret.util';
import { verifyUnsubscribeToken } from './verify-unsubscribe-token.util';

export const unsubscribeMerchant = async (
  client: ApiClient,
  token: string | undefined,
): Promise<boolean> => {
  const merchantId =
    token === undefined
      ? null
      : verifyUnsubscribeToken(token, readUnsubscribeSecret());

  if (merchantId === null) {
    return false;
  }

  await executeWithRetry(() =>
    client.mutation({
      updateMerchant: {
        __args: {
          id: merchantId,
          data: {
            emailUnsubscribed: true,
            emailUnsubscribedAt: new Date().toISOString(),
          },
        },
        id: true,
      },
    }),
  );

  return true;
};
