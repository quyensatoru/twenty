import { defineLogicFunction } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { HIGH_VALUE_SHOPIFY_PLANS } from '../constants/shopify-plans';
import { SYNC_PROSPECTS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { toAppKey } from '../utils/app-key';
import {
  type AppRow,
  type Connection,
  type MerchantRow,
  type ProspectRow,
} from '../utils/api-types';
import { chunk } from '../utils/chunk';
import { executeWithRetry } from '../utils/execute-with-retry';
import {
  collectInstalledAppKeys,
  pickMerchantEmail,
} from '../utils/merchant-facts';
import { resolveMerchantSelection } from '../utils/merchant-selection';
import { normalizeDomain } from '../utils/normalize-domain';
import { computeProspectId } from '../utils/prospect-id';
import { isHighValuePlan, pickHighestPlan } from '../utils/shopify-plan';
import {
  applyMerchantAppKeys,
  haveAppColumnsChanged,
} from '../utils/split-app-keys';

const PAGE_SIZE = 200;
const ID_FILTER_CHUNK_SIZE = 200;
// QUERY_MAX_RECORDS on the server rejects anything larger.
const UPSERT_BATCH_SIZE = 200;
// Stops well before the 600s hard timeout: a run that stops on its own reports
// what is left to do, where a killed run reports nothing at all.
const TIME_BUDGET_MS = 480_000;

type ApiClient = any;

const prospectSelection = {
  id: true,
  domain: true,
  shopifyPlan: true,
  ourApps: true,
  otherApps: true,
  email: { primaryEmail: true },
  lastSyncedAt: true,
} as const;

const collectAppKeysById = async (
  client: ApiClient,
): Promise<Map<string, string>> => {
  const appKeyById = new Map<string, string>();
  let after: string | undefined;

  do {
    const { apps } = await executeWithRetry<{ apps: Connection<AppRow> }>(() =>
      client.query({
        apps: {
          __args: { first: PAGE_SIZE, after },
          edges: { node: { id: true, name: true } },
          pageInfo: { hasNextPage: true, endCursor: true },
        },
      }),
    );

    for (const edge of apps?.edges ?? []) {
      const appKey = toAppKey(edge.node.name ?? '');

      if (appKey !== null) {
        appKeyById.set(edge.node.id, appKey);
      }
    }

    after = apps?.pageInfo?.hasNextPage ? apps.pageInfo.endCursor : undefined;
  } while (after !== undefined);

  return appKeyById;
};

// Every merchant row, grouped by shop. Scanning the whole table rather than
// filtering by plan is what makes the app columns right: a shop qualifies
// through one app's row (say MIDA on Advanced) while the row that proves it
// also runs BLOY carries `BLOY_UNINSTALLED` in the plan column. A filtered
// query never returns that second row, so BLOY could never appear.
const scanMerchantsByDomain = async ({
  client,
  merchantSelection,
  shouldStop,
}: {
  client: ApiClient;
  merchantSelection: Record<string, unknown>;
  shouldStop: () => boolean;
}): Promise<{
  merchantsByDomain: Map<string, MerchantRow[]>;
  scanned: number;
  isComplete: boolean;
}> => {
  const merchantsByDomain = new Map<string, MerchantRow[]>();
  let after: string | undefined;
  let scanned = 0;

  do {
    if (shouldStop()) {
      return { merchantsByDomain, scanned, isComplete: false };
    }

    const page = await executeWithRetry<{
      merchants: Connection<MerchantRow>;
    }>(() =>
      client.query({
        merchants: {
          __args: { first: PAGE_SIZE, after },
          edges: { node: merchantSelection },
          pageInfo: { hasNextPage: true, endCursor: true },
        },
      }),
    );

    for (const edge of page.merchants?.edges ?? []) {
      scanned += 1;

      const domain = normalizeDomain(edge.node.name ?? '');

      if (domain === null) {
        continue;
      }

      merchantsByDomain.set(domain, [
        ...(merchantsByDomain.get(domain) ?? []),
        edge.node,
      ]);
    }

    after = page.merchants?.pageInfo?.hasNextPage
      ? page.merchants.pageInfo.endCursor
      : undefined;
  } while (after !== undefined);

  return { merchantsByDomain, scanned, isComplete: true };
};

const fetchProspectsByIds = async (
  client: ApiClient,
  prospectIds: string[],
): Promise<Map<string, ProspectRow>> => {
  const prospectById = new Map<string, ProspectRow>();

  for (const idChunk of chunk(prospectIds, ID_FILTER_CHUNK_SIZE)) {
    const { prospects } = await executeWithRetry<{
      prospects: Connection<ProspectRow>;
    }>(() =>
      client.query({
        prospects: {
          __args: {
            filter: { id: { in: idChunk } },
            first: ID_FILTER_CHUNK_SIZE,
          },
          edges: { node: prospectSelection },
        },
      }),
    );

    for (const edge of prospects?.edges ?? []) {
      prospectById.set(edge.node.id, edge.node);
    }
  }

  return prospectById;
};

// Shops already flagged high-value. They are refreshed even when no merchant
// row says so any more, which is how a downgrade gets noticed.
const collectStoredHighValueProspects = async (
  client: ApiClient,
): Promise<ProspectRow[]> => {
  const prospects: ProspectRow[] = [];
  let after: string | undefined;

  do {
    const page = await executeWithRetry<{
      prospects: Connection<ProspectRow>;
    }>(() =>
      client.query({
        prospects: {
          __args: {
            filter: { shopifyPlan: { in: [...HIGH_VALUE_SHOPIFY_PLANS] } },
            first: PAGE_SIZE,
            after,
          },
          edges: { node: prospectSelection },
          pageInfo: { hasNextPage: true, endCursor: true },
        },
      }),
    );

    for (const edge of page.prospects?.edges ?? []) {
      prospects.push(edge.node);
    }

    after = page.prospects?.pageInfo?.hasNextPage
      ? page.prospects.pageInfo.endCursor
      : undefined;
  } while (after !== undefined);

  return prospects;
};

// One request per 200 records instead of one per record. The app shares a
// single rate-limit budget across all its functions, so a write loop that
// issues a request per record empties it and takes the triggers down with it.
// `upsert` matches on id (or any unique index whose fields are present) and
// updates only the columns passed, so it serves as both create and update.
const upsertRecords = async ({
  client,
  mutationName,
  rows,
  shouldStop,
}: {
  client: ApiClient;
  mutationName: string;
  rows: Record<string, unknown>[];
  shouldStop: () => boolean;
}): Promise<number> => {
  let written = 0;

  for (const batch of chunk(rows, UPSERT_BATCH_SIZE)) {
    if (shouldStop()) {
      break;
    }

    await executeWithRetry(() =>
      client.mutation({
        [mutationName]: {
          __args: { data: batch, upsert: true },
          id: true,
        },
      }),
    );

    written += batch.length;
  }

  return written;
};

const readWriteLimit = (payload: unknown): number | undefined => {
  const raw = (payload as { limit?: unknown } | null | undefined)?.limit;

  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0
    ? Math.floor(raw)
    : undefined;
};

const readStoredEmail = (stored: ProspectRow | undefined): string | null => {
  const email = stored?.email?.primaryEmail?.trim();

  return email === undefined || email === '' ? null : email;
};

const handler = async (
  payload?: unknown,
): Promise<{
  merchantsScanned: number;
  shopsHighValue: number;
  readsInstallFlag: boolean;
  readsEmail: boolean;
  prospectsCreated: number;
  prospectsRefreshed: number;
  merchantsLinked: number;
  ourAppsCleared: number;
  createsRemaining: number;
  refreshesRemaining: number;
  completed: boolean;
}> => {
  const client: ApiClient = new CoreApiClient();
  const startedAt = Date.now();
  const syncedAt = new Date().toISOString();
  const writeLimit = readWriteLimit(payload);
  const shouldStop = () => Date.now() - startedAt > TIME_BUDGET_MS;

  const appKeyById = await collectAppKeysById(client);
  const merchantSelection = await resolveMerchantSelection(client);
  const { merchantsByDomain, scanned, isComplete } = await scanMerchantsByDomain(
    { client, merchantSelection, shouldStop },
  );

  // Writing from a half-read table would clear the app columns of every shop
  // the scan never reached, so an incomplete scan writes nothing at all.
  if (!isComplete) {
    return {
      merchantsScanned: scanned,
      shopsHighValue: 0,
      readsInstallFlag: 'using' in merchantSelection,
      readsEmail: 'email' in merchantSelection,
      prospectsCreated: 0,
      prospectsRefreshed: 0,
      merchantsLinked: 0,
      ourAppsCleared: 0,
      createsRemaining: 0,
      refreshesRemaining: 0,
      completed: false,
    };
  }

  const highValueDomains = [...merchantsByDomain.entries()]
    .filter(([, merchants]) =>
      merchants.some((merchant) =>
        isHighValuePlan(merchant.shopifyPlan, HIGH_VALUE_SHOPIFY_PLANS),
      ),
    )
    .map(([domain]) => domain);

  const domainByProspectId = new Map<string, string>();

  for (const domain of highValueDomains) {
    const prospectId = computeProspectId(domain);

    if (prospectId !== null) {
      domainByProspectId.set(prospectId, domain);
    }
  }

  const storedById = await fetchProspectsByIds(client, [
    ...domainByProspectId.keys(),
  ]);

  for (const prospect of await collectStoredHighValueProspects(client)) {
    if (!domainByProspectId.has(prospect.id)) {
      const domain = normalizeDomain(prospect.domain ?? '');

      // No merchant row anywhere and never synced: a CSV row, whose columns are
      // the only record there is.
      if (domain === null || prospect.lastSyncedAt === null) {
        continue;
      }

      domainByProspectId.set(prospect.id, domain);
    }

    storedById.set(prospect.id, prospect);
  }

  const creates: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  let ourAppsCleared = 0;

  for (const [prospectId, domain] of domainByProspectId) {
    const merchants = merchantsByDomain.get(domain) ?? [];
    const stored = storedById.get(prospectId);

    const appColumns = applyMerchantAppKeys(
      collectInstalledAppKeys(merchants, appKeyById),
      stored ?? {},
    );
    // An uninstalled row still reports the plan it last saw, so the plan is read
    // from every row of the shop. Null means no row named a plan at all, and
    // then whatever is stored stays.
    const shopifyPlan =
      pickHighestPlan(merchants.map((merchant) => merchant.shopifyPlan)) ??
      stored?.shopifyPlan ??
      null;

    // Only filled in when empty: BD may have corrected the address by hand and
    // the merchant row is not authoritative over that.
    const emailToWrite =
      readStoredEmail(stored) === null ? pickMerchantEmail(merchants) : null;

    if (stored === undefined) {
      creates.push({
        id: prospectId,
        domain,
        shopifyPlan,
        ...appColumns,
        ...(emailToWrite === null
          ? {}
          : { email: { primaryEmail: emailToWrite } }),
        lastSyncedAt: syncedAt,
      });

      continue;
    }

    const hasChanged =
      stored.shopifyPlan !== shopifyPlan ||
      haveAppColumnsChanged(appColumns, stored) ||
      emailToWrite !== null;

    if (!hasChanged) {
      continue;
    }

    if ((stored.ourApps ?? []).length > appColumns.ourApps.length) {
      ourAppsCleared += 1;
    }

    updates.push({
      id: prospectId,
      shopifyPlan,
      ...appColumns,
      ...(emailToWrite === null
        ? {}
        : { email: { primaryEmail: emailToWrite } }),
      lastSyncedAt: syncedAt,
    });
  }

  const prospectsCreated = await upsertRecords({
    client,
    mutationName: 'createProspects',
    rows: writeLimit === undefined ? creates : creates.slice(0, writeLimit),
    shouldStop,
  });

  const prospectsRefreshed = await upsertRecords({
    client,
    mutationName: 'createProspects',
    rows: writeLimit === undefined ? updates : updates.slice(0, writeLimit),
    shouldStop,
  });

  const createdIds = new Set(
    creates.slice(0, prospectsCreated).map((row) => row.id as string),
  );

  // Links only for shops whose prospect exists, otherwise a sliced run would
  // point a merchant at a row that was never created.
  const merchantLinks = [...domainByProspectId.entries()].flatMap(
    ([prospectId, domain]) => {
      if (!storedById.has(prospectId) && !createdIds.has(prospectId)) {
        return [];
      }

      return (merchantsByDomain.get(domain) ?? [])
        .filter((merchant) => merchant.prospectId !== prospectId)
        .map((merchant) => ({ id: merchant.id, prospectId }));
    },
  );

  // Upsert on merchant matches by id and also clears deletedAt. Harmless here:
  // the scan returns live rows only, so the column is already null.
  const merchantsLinked = await upsertRecords({
    client,
    mutationName: 'createMerchants',
    rows: merchantLinks,
    shouldStop,
  });

  const createsRemaining = creates.length - prospectsCreated;
  const refreshesRemaining = updates.length - prospectsRefreshed;

  return {
    merchantsScanned: scanned,
    shopsHighValue: highValueDomains.length,
    readsInstallFlag: 'using' in merchantSelection,
    readsEmail: 'email' in merchantSelection,
    prospectsCreated,
    prospectsRefreshed,
    merchantsLinked,
    ourAppsCleared,
    createsRemaining,
    refreshesRemaining,
    completed:
      createsRemaining === 0 &&
      refreshesRemaining === 0 &&
      merchantsLinked === merchantLinks.length,
  };
};

// Daily: folds merchant rows into one prospect per domain and rebuilds each
// high-value shop's plan, email and app columns.
//
// `ourApps` mirrors the rows where `using` is still true, which is what lets a
// shop that uninstalled reappear as an upsell candidate. The plan is read from
// every row including uninstalled ones, since they still report the last plan
// they saw.
//
// Accepts `{ "limit": n }` to cap how many prospects it writes in one run, for
// a first backfill large enough to run into the app's rate-limit budget. The
// run is idempotent, so repeating it until `completed` is true finishes the job.
export default defineLogicFunction({
  universalIdentifier: SYNC_PROSPECTS_LOGIC_FUNCTION_UID,
  name: 'sync-prospects-from-merchants',
  description:
    "Daily: rebuilds each high-value shop's plan, email, our apps and other apps from its merchant rows, and links merchants to their prospect.",
  timeoutSeconds: 600,
  cronTriggerSettings: {
    pattern: '0 3 * * *',
  },
  handler,
});
