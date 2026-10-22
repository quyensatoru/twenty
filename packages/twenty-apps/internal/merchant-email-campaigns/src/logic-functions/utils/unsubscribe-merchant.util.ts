import { type ApiClient } from '../../types/api-client';
import { executeWithRetry } from '../../utils/execute-with-retry.util';
import { readUnsubscribeSecret } from './read-unsubscribe-secret.util';
import { suppressEmail } from './suppress-email.util';
import { verifyUnsubscribeToken } from './verify-unsubscribe-token.util';

const EMAIL_SUBJECT_PREFIX = 'email:';

// A token's subject is either a merchant id (the original scheme) or
// `email:<address>` (manual-list recipients, who have no merchant row). Both
// are signed and verified by the same function, so this is the only place
// that needs to know the difference.
export const unsubscribeMerchant = async (
  client: ApiClient,
  token: string | undefined,
): Promise<boolean> => {
  const subject =
    token === undefined
      ? null
      : verifyUnsubscribeToken(token, readUnsubscribeSecret());

  if (subject === null) {
    return false;
  }

  if (subject.startsWith(EMAIL_SUBJECT_PREFIX)) {
    await suppressEmail(client, subject.slice(EMAIL_SUBJECT_PREFIX.length));

    return true;
  }

  await executeWithRetry(() =>
    client.mutation({
      updateMerchant: {
        __args: {
          id: subject,
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
