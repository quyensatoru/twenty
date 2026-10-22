import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type MerchantRow } from '../../types/merchant-row';
import { executeWithRetry } from '../../utils/execute-with-retry.util';
import { resolveMerchantSelection } from './resolve-merchant-selection.util';

export type MerchantsByEmail = {
  byEmail: Map<string, MerchantRow>;
  // A shop owner can install more than one app, and every install is its own
  // merchant row with the same email: unscoped, which row answers "this
  // address" is arbitrary. Surfaced so the studio can tell someone to narrow
  // the app picker instead of silently mailing the wrong app's content.
  ambiguousEmails: Set<string>;
};

// A manual-list address that matches an existing merchant uses that
// merchant's own data for template variables and unsubscribe status, same as
// an audience-filter broadcast would. `appIds` scopes the match the same way
// the audience filter's own app picker does, for exactly this ambiguity.
export const fetchMerchantsByEmail = async (
  client: ApiClient,
  emails: string[],
  appIds: string[] = [],
): Promise<MerchantsByEmail> => {
  if (emails.length === 0) {
    return { byEmail: new Map(), ambiguousEmails: new Set() };
  }

  const selection = await resolveMerchantSelection(client);
  const { merchants } = await executeWithRetry<{
    merchants: Connection<MerchantRow>;
  }>(() =>
    client.query({
      merchants: {
        __args: {
          filter: {
            and: [
              { email: { primaryEmail: { in: emails } } },
              ...(appIds.length > 0 ? [{ appId: { in: appIds } }] : []),
            ],
          },
          first: emails.length * (appIds.length === 1 ? 1 : 10),
        },
        edges: { node: selection },
      },
    }),
  );

  const byEmail = new Map<string, MerchantRow>();
  const ambiguousEmails = new Set<string>();

  for (const edge of merchants?.edges ?? []) {
    const email = edge.node.email?.primaryEmail?.trim().toLowerCase();

    if (email === undefined || email === '') {
      continue;
    }

    if (byEmail.has(email)) {
      ambiguousEmails.add(email);
      continue;
    }

    byEmail.set(email, edge.node);
  }

  return { byEmail, ambiguousEmails };
};
