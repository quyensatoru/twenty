import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { executeWithRetry } from '../../utils/execute-with-retry.util';

// Idempotent: clicking an already-processed unsubscribe link (a retried
// webhook, a second click) must not create a second row for the same email.
export const suppressEmail = async (
  client: ApiClient,
  rawEmail: string,
): Promise<void> => {
  const email = rawEmail.trim().toLowerCase();

  if (email === '') {
    return;
  }

  const { emailSuppressions } = await executeWithRetry<{
    emailSuppressions: Connection<{ id: string }>;
  }>(() =>
    client.query({
      emailSuppressions: {
        __args: { filter: { email: { eq: email } }, first: 1 },
        edges: { node: { id: true } },
      },
    }),
  );

  if ((emailSuppressions?.edges ?? []).length > 0) {
    return;
  }

  await executeWithRetry(() =>
    client.mutation({
      createEmailSuppression: {
        __args: {
          data: {
            email,
            reason: 'UNSUBSCRIBED',
            suppressedAt: new Date().toISOString(),
          },
        },
        id: true,
      },
    }),
  );
};
