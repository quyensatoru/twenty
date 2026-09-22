import { HIGH_VALUE_SHOPIFY_PLANS } from '../constants/shopify-plans';

import { toAppKey } from './app-key';
import {
  type AppRow,
  type Connection,
  type MerchantRow,
  type ProspectRow,
} from './api-types';
import { executeWithRetry } from './execute-with-retry';
import { collectInstalledAppKeys, pickMerchantEmail } from './merchant-facts';
import { resolveMerchantSelection } from './merchant-selection';
import { normalizeDomain } from './normalize-domain';
import { computeProspectId } from './prospect-id';
import { pickHighestPlan } from './shopify-plan';
import { applyMerchantAppKeys } from './split-app-keys';

const MERCHANTS_PAGE_SIZE = 200;
const APPS_PAGE_SIZE = 200;

type ApiClient = any;

export type MerchantChange = {
  id?: string | null;
  name?: string | null;
  appId?: string | null;
  shopifyPlan?: string | null;
  prospectId?: string | null;
  using?: boolean | null;
  email?: { primaryEmail: string | null } | null;
};

export type RefreshResult = {
  domain: string | null;
  prospectId: string | null;
  ourApps: string[];
  otherApps: string[];
  created: boolean;
  skipped: 'no-domain' | 'not-high-value' | null;
};

// Rebuilds one shop from its merchant rows. Same rules as the daily job applied
// to a single prospect, so an install or an uninstall shows up in the BD area in
// seconds instead of at the next 03:00 run.
export const refreshProspectFromMerchants = async ({
  client,
  merchant,
  merchantStillExists,
}: {
  client: ApiClient;
  merchant: MerchantChange;
  // False for a delete event. A row read back from the API never includes the
  // deleted one, so without this flag the function would fold the merchant it
  // was told about straight back in and the uninstall would be a no-op.
  merchantStillExists: boolean;
}): Promise<RefreshResult> => {
  const domain = normalizeDomain(merchant.name ?? '');
  const prospectId = domain === null ? null : computeProspectId(domain);

  if (domain === null || prospectId === null) {
    return {
      domain,
      prospectId: null,
      ourApps: [],
      otherApps: [],
      created: false,
      skipped: 'no-domain',
    };
  }

  const [appKeyById, stored, merchants] = await Promise.all([
    collectAppKeysById(client),
    fetchProspect(client, prospectId),
    fetchMerchantsOfShop(client, { prospectId, domain }),
  ]);

  // A merchant created a moment ago may not be readable yet, so fold it in by
  // hand and link it below.
  const isTriggeringMerchantMissing =
    merchantStillExists &&
    merchant.id !== null &&
    merchant.id !== undefined &&
    merchants.every((row) => row.id !== merchant.id);

  const allMerchants = isTriggeringMerchantMissing
    ? [
        ...merchants,
        {
          id: merchant.id as string,
          name: merchant.name ?? null,
          appId: merchant.appId ?? null,
          shopifyPlan: merchant.shopifyPlan ?? null,
          prospectId,
          using: merchant.using ?? null,
          email: merchant.email ?? null,
        },
      ]
    : merchants;

  // Read from every row, uninstalled ones included: they still report the last
  // plan they saw, and dropping them would blank the column on an uninstall.
  const shopifyPlan =
    pickHighestPlan(allMerchants.map((row) => row.shopifyPlan)) ??
    stored?.shopifyPlan ??
    null;

  if (
    stored === undefined &&
    !HIGH_VALUE_SHOPIFY_PLANS.includes(shopifyPlan ?? '')
  ) {
    return {
      domain,
      prospectId,
      ourApps: [],
      otherApps: [],
      created: false,
      skipped: 'not-high-value',
    };
  }

  const appColumns = applyMerchantAppKeys(
    collectInstalledAppKeys(allMerchants, appKeyById),
    stored ?? {},
  );
  const storedEmail = stored?.email?.primaryEmail?.trim();
  const emailToWrite =
    storedEmail === undefined || storedEmail === ''
      ? pickMerchantEmail(allMerchants)
      : null;
  const syncedAt = new Date().toISOString();

  await executeWithRetry(() =>
    client.mutation({
      createProspects: {
        __args: {
          data: [
            {
              id: prospectId,
              ...(stored === undefined ? { domain } : {}),
              shopifyPlan,
              ...appColumns,
              ...(emailToWrite === null
                ? {}
                : { email: { primaryEmail: emailToWrite } }),
              lastSyncedAt: syncedAt,
            },
          ],
          upsert: true,
        },
        id: true,
      },
    }),
  );

  const merchantsToLink = allMerchants.filter(
    (row) => row.prospectId !== prospectId,
  );

  if (merchantsToLink.length > 0) {
    await executeWithRetry(() =>
      client.mutation({
        createMerchants: {
          __args: {
            data: merchantsToLink.map((row) => ({ id: row.id, prospectId })),
            upsert: true,
          },
          id: true,
        },
      }),
    ).catch(() => undefined);
  }

  return {
    domain,
    prospectId,
    ...appColumns,
    created: stored === undefined,
    skipped: null,
  };
};

const collectAppKeysById = async (
  client: ApiClient,
): Promise<Map<string, string>> => {
  const { apps } = await executeWithRetry<{ apps: Connection<AppRow> }>(() =>
    client.query({
      apps: {
        __args: { first: APPS_PAGE_SIZE },
        edges: { node: { id: true, name: true } },
      },
    }),
  );

  const appKeyById = new Map<string, string>();

  for (const edge of apps?.edges ?? []) {
    const appKey = toAppKey(edge.node.name ?? '');

    if (appKey !== null) {
      appKeyById.set(edge.node.id, appKey);
    }
  }

  return appKeyById;
};

const fetchProspect = async (
  client: ApiClient,
  prospectId: string,
): Promise<ProspectRow | undefined> => {
  const { prospects } = await executeWithRetry<{
    prospects: Connection<ProspectRow>;
  }>(() =>
    client.query({
      prospects: {
        __args: { filter: { id: { eq: prospectId } }, first: 1 },
        edges: {
          node: {
            id: true,
            domain: true,
            shopifyPlan: true,
            ourApps: true,
            otherApps: true,
            email: { primaryEmail: true },
            lastSyncedAt: true,
          },
        },
      },
    }),
  );

  return prospects?.edges?.[0]?.node;
};

// Two passes on purpose. By prospectId finds the rows already linked; by name
// finds the rest, which is how a row whose own plan column says
// `BLOY_UNINSTALLED` gets counted at all — nothing ever linked it.
const fetchMerchantsOfShop = async (
  client: ApiClient,
  { prospectId, domain }: { prospectId: string; domain: string },
): Promise<MerchantRow[]> => {
  const merchantSelection = await resolveMerchantSelection(client);

  const query = async (filter: Record<string, unknown>) => {
    const { merchants } = await executeWithRetry<{
      merchants: Connection<MerchantRow>;
    }>(() =>
      client.query({
        merchants: {
          __args: { filter, first: MERCHANTS_PAGE_SIZE },
          edges: { node: merchantSelection },
        },
      }),
    );

    return (merchants?.edges ?? []).map((edge) => edge.node);
  };

  const [linked, byName] = await Promise.all([
    query({ prospectId: { eq: prospectId } }),
    query({ name: { eq: domain } }),
  ]);

  const merchantById = new Map<string, MerchantRow>();

  for (const row of [...linked, ...byName]) {
    merchantById.set(row.id, row);
  }

  return [...merchantById.values()];
};
