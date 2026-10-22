import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { executeWithRetry } from '../../utils/execute-with-retry.util';

export const fetchSuppressedEmails = async (
  client: ApiClient,
  emails: string[],
): Promise<Set<string>> => {
  if (emails.length === 0) {
    return new Set();
  }

  const { emailSuppressions } = await executeWithRetry<{
    emailSuppressions: Connection<{ email?: string | null }>;
  }>(() =>
    client.query({
      emailSuppressions: {
        __args: { filter: { email: { in: emails } }, first: emails.length },
        edges: { node: { email: true } },
      },
    }),
  );

  return new Set(
    (emailSuppressions?.edges ?? [])
      .map((edge) => edge.node.email?.toLowerCase())
      .filter((email): email is string => email !== undefined),
  );
};
