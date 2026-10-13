import { type ApiClient } from '../../types/api-client';
import { executeWithRetry } from './execute-with-retry.util';

export type MerchantMatch = {
  merchantId: string;
  shopDomain: string | null;
};

type MerchantCandidate = {
  id: string;
  name: string | null;
  appId: string | null;
};

// ILIKE gives case-insensitive equality; `_` is common in addresses and
// must not act as a wildcard.
const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, '\\$&');

type MerchantConnection = {
  merchants?: { edges?: { node: MerchantCandidate }[] };
};

const appIdByName = new Map<string, string | null>();

const readAppId = async (
  client: ApiClient,
  appName: string,
): Promise<string | null> => {
  if (appIdByName.has(appName)) {
    return appIdByName.get(appName) ?? null;
  }

  const result = await executeWithRetry<{
    apps?: { edges?: { node: { id: string } }[] };
  }>(() =>
    client.query({
      apps: {
        __args: { filter: { name: { eq: appName } }, first: 1 },
        edges: { node: { id: true } },
      },
    }),
  );
  const appId: string | null = result?.apps?.edges?.[0]?.node?.id ?? null;

  appIdByName.set(appName, appId);

  return appId;
};

// A shop installs each product separately, so one domain is several merchant
// rows. The row of the product whose inbox the chat came from wins.
const pickCandidate = (
  candidates: MerchantCandidate[],
  appId: string | null,
): MerchantCandidate | undefined =>
  candidates.find((candidate) => candidate.appId === appId) ?? candidates[0];

export const matchMerchant = async ({
  client,
  appName,
  shopDomains,
  emails,
}: {
  client: ApiClient;
  appName: string;
  shopDomains: string[];
  emails: string[];
}): Promise<MerchantMatch | undefined> => {
  const appId = await readAppId(client, appName);

  if (shopDomains.length > 0) {
    const result = await executeWithRetry<MerchantConnection>(() =>
      client.query({
        merchants: {
          __args: { filter: { name: { in: shopDomains } }, first: 20 },
          edges: { node: { id: true, name: true, appId: true } },
        },
      }),
    );
    const candidates = (result?.merchants?.edges ?? []).map(
      (edge) => edge.node,
    );
    const match = pickCandidate(candidates, appId);

    if (match !== undefined) {
      return { merchantId: match.id, shopDomain: match.name };
    }
  }

  if (emails.length === 0) {
    return undefined;
  }

  const result = await executeWithRetry<MerchantConnection>(() =>
    client.query({
      merchants: {
        __args: {
          filter: {
            or: emails.map((email) => ({
              email: { primaryEmail: { ilike: escapeLikePattern(email) } },
            })),
          },
          first: 20,
        },
        edges: { node: { id: true, name: true, appId: true } },
      },
    }),
  );
  const candidates = (result?.merchants?.edges ?? []).map((edge) => edge.node);
  const match = pickCandidate(candidates, appId);

  return match === undefined
    ? undefined
    : { merchantId: match.id, shopDomain: match.name };
};
