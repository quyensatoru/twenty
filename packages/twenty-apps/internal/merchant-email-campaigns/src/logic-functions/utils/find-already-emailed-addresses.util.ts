import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { executeWithRetry } from '../../utils/execute-with-retry.util';

// A shop has one merchant row per app, all carrying the same address, so a
// broadcast to several apps would otherwise mail the owner once per app.
export const findAlreadyEmailedAddresses = async ({
  client,
  campaignId,
  emails,
}: {
  client: ApiClient;
  campaignId: string;
  emails: string[];
}): Promise<Set<string>> => {
  if (emails.length === 0) {
    return new Set();
  }

  const { emailSends } = await executeWithRetry<{
    emailSends: Connection<{ name?: string | null }>;
  }>(() =>
    client.query({
      emailSends: {
        __args: {
          filter: {
            campaignId: { eq: campaignId },
            name: { in: emails },
            status: { eq: 'SENT' },
          },
          first: emails.length,
        },
        edges: { node: { name: true } },
      },
    }),
  );

  return new Set(
    (emailSends?.edges ?? [])
      .map((edge) => edge.node.name?.toLowerCase())
      .filter((email): email is string => email !== undefined),
  );
};
