import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type MerchantRow } from '../../types/merchant-row';
import { executeWithRetry } from '../../utils/execute-with-retry.util';
import { resolveMerchantSelection } from './resolve-merchant-selection.util';

// A manual-list address that matches an existing merchant uses that
// merchant's own data for template variables and unsubscribe status, same as
// an audience-filter broadcast would.
export const fetchMerchantsByEmail = async (
  client: ApiClient,
  emails: string[],
): Promise<Map<string, MerchantRow>> => {
  if (emails.length === 0) {
    return new Map();
  }

  const selection = await resolveMerchantSelection(client);
  const { merchants } = await executeWithRetry<{
    merchants: Connection<MerchantRow>;
  }>(() =>
    client.query({
      merchants: {
        __args: {
          filter: { email: { primaryEmail: { in: emails } } },
          first: emails.length,
        },
        edges: { node: selection },
      },
    }),
  );

  const byEmail = new Map<string, MerchantRow>();

  for (const edge of merchants?.edges ?? []) {
    const email = edge.node.email?.primaryEmail?.trim().toLowerCase();

    if (email !== undefined && email !== '' && !byEmail.has(email)) {
      byEmail.set(email, edge.node);
    }
  }

  return byEmail;
};
