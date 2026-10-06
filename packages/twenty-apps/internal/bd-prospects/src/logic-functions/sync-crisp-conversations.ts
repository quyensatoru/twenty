import { defineLogicFunction } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { SYNC_CRISP_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection, type ProspectRow } from '../utils/api-types';
import {
  resolveCrispMatch,
  type CrispCredentials,
  type CrispMatch,
} from '../utils/crisp-search';
import { executeWithRetry } from '../utils/execute-with-retry';
import {
  readCrispCredentials,
  readCrispSettings,
  resolveCrispWebsiteIds,
  type CrispSettings,
} from '../utils/read-crisp-settings';

type ApiClient = any;

// Stale rows first in small pages: the batch spreads the work across days
// instead of rescanning everything every night, same shape as the LinkedIn
// batch. Crisp is our own API with no monthly quota, so the daily run refreshes
// every row checked more than a day ago, oldest first.
const PROSPECT_PAGE_SIZE = 100;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
// Stops well before the 600s hard timeout, same shape as the merchant sync.
const TIME_BUDGET_MS = 480_000;

const prospectSelection = {
  id: true,
  domain: true,
  shopName: true,
  ourApps: true,
  crispChat: { primaryLinkUrl: true },
  crispCheckedAt: true,
} as const;

export type CrispSyncSummary = {
  checked: number;
  linked: number;
  empty: number;
  skipped: number;
  failed: string[];
  completed: boolean;
  disabled?: true;
};

type SyncProspectRow = Pick<ProspectRow, 'id' | 'domain'> & {
  shopName?: string | null;
  ourApps?: string[] | null;
  crispChat?: { primaryLinkUrl: string | null } | null;
  crispCheckedAt?: string | null;
};

const isFresh = (checkedAt: string | null | undefined): boolean => {
  if (typeof checkedAt !== 'string' || checkedAt.length === 0) {
    return false;
  }

  const checkedTime = new Date(checkedAt).getTime();

  if (Number.isNaN(checkedTime)) {
    return false;
  }

  return Date.now() - checkedTime < STALE_AFTER_MS;
};

const stampChecked = async (
  client: ApiClient,
  prospectId: string,
): Promise<void> => {
  await executeWithRetry(() =>
    client.mutation({
      updateProspect: {
        __args: {
          id: prospectId,
          data: { crispCheckedAt: new Date().toISOString() },
        },
        id: true,
      },
    }),
  );
};

const writeMatch = async ({
  client,
  prospectId,
  match,
}: {
  client: ApiClient;
  prospectId: string;
  match: CrispMatch;
}): Promise<void> => {
  await executeWithRetry(() =>
    client.mutation({
      updateProspect: {
        __args: {
          id: prospectId,
          data: {
            crispChat: {
              primaryLinkUrl: match.url,
              primaryLinkLabel:
                match.nickname ?? match.email ?? 'Crisp conversation',
            },
            // Null clears a stale address: the link above is the only
            // conversation this column may describe.
            crispEmail: match.email
              ? { primaryEmail: match.email }
              : null,
            crispCheckedAt: new Date().toISOString(),
          },
        },
        id: true,
      },
    }),
  );
};

const syncOne = async ({
  client,
  credentials,
  settings,
  prospect,
  summary,
}: {
  client: ApiClient;
  credentials: CrispCredentials;
  settings: CrispSettings;
  prospect: SyncProspectRow;
  summary: CrispSyncSummary;
}): Promise<void> => {
  const domain = prospect.domain?.trim().toLowerCase() ?? '';

  // No domain, nothing to search: stamp so the batch stops picking it up.
  if (domain.length === 0) {
    await stampChecked(client, prospect.id);
    summary.skipped += 1;
    return;
  }

  const match = await resolveCrispMatch({
    credentials,
    websiteIds: resolveCrispWebsiteIds({
      ourApps: prospect.ourApps,
      settings,
    }),
    domain,
    shopName: prospect.shopName,
  });

  if (match === undefined) {
    // Miss: columns stay as they are per spec for never-found rows, and a
    // previously found link is left untouched: text search is fuzzy and a
    // miss must not wipe a good link. Stamp so a miss is not re-searched
    // until it goes stale.
    await stampChecked(client, prospect.id);
    summary.empty += 1;
    return;
  }

  await writeMatch({ client, prospectId: prospect.id, match });
  summary.linked += 1;
};

export const syncCrispConversations = async ({
  client,
  credentials,
  settings,
  prospectId,
  writeLimit,
  shouldStop = () => false,
}: {
  client: ApiClient;
  credentials: CrispCredentials;
  settings: CrispSettings;
  prospectId?: string;
  writeLimit?: number;
  shouldStop?: () => boolean;
}): Promise<CrispSyncSummary> => {
  const summary: CrispSyncSummary = {
    checked: 0,
    linked: 0,
    empty: 0,
    skipped: 0,
    failed: [],
    completed: true,
  };

  if (typeof prospectId === 'string') {
    const { prospects } = await executeWithRetry<{
      prospects: Connection<SyncProspectRow>;
    }>(() =>
      client.query({
        prospects: {
          __args: { filter: { id: { eq: prospectId } }, first: 1 },
          edges: { node: prospectSelection },
        },
      }),
    );
    const prospect = prospects?.edges?.[0]?.node;

    if (prospect === undefined) {
      throw new Error(`Prospect ${prospectId} not found`);
    }

    summary.checked += 1;

    try {
      await syncOne({ client, credentials, settings, prospect, summary });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      summary.failed.push(`${prospect.id}: ${message}`);
      summary.completed = false;
    }

    return summary;
  }

  let after: string | undefined;

  for (;;) {
    if (shouldStop()) {
      summary.completed = false;
      break;
    }

    if (writeLimit !== undefined && summary.checked >= writeLimit) {
      summary.completed = false;
      break;
    }

    const { prospects } = await executeWithRetry<{
      prospects: Connection<SyncProspectRow> & {
        pageInfo?: { hasNextPage: boolean; endCursor: string };
      };
    }>(() =>
      client.query({
        prospects: {
          __args: {
            first: PROSPECT_PAGE_SIZE,
            after,
            orderBy: [{ crispCheckedAt: 'AscNullsFirst' }],
          },
          edges: { node: prospectSelection },
          pageInfo: { hasNextPage: true, endCursor: true },
        },
      }),
    );
    const edges = prospects?.edges ?? [];

    if (edges.length === 0) {
      break;
    }

    let reachedFresh = false;

    for (const { node: prospect } of edges) {
      if (shouldStop()) {
        summary.completed = false;
        break;
      }

      if (writeLimit !== undefined && summary.checked >= writeLimit) {
        summary.completed = false;
        break;
      }

      // Ordered oldest-first, so the first fresh row ends the run: every row
      // after it is fresher. Never-checked rows always drain.
      const isNew =
        typeof prospect.crispCheckedAt !== 'string' ||
        prospect.crispCheckedAt.length === 0;

      if (!isNew && isFresh(prospect.crispCheckedAt)) {
        reachedFresh = true;
        break;
      }

      summary.checked += 1;

      try {
        await syncOne({ client, credentials, settings, prospect, summary });
      } catch (error) {
        // One bad prospect must not fail the batch. Auth/quota errors abort
        // the whole run instead of burning through prospects that would all
        // fail the same way.
        const message = error instanceof Error ? error.message : String(error);

        if (/HTTP 401|HTTP 403|HTTP 429/.test(message)) {
          throw error;
        }

        summary.failed.push(`${prospect.id}: ${message}`);
      }
    }

    if (reachedFresh) {
      break;
    }

    if (summary.completed === false) {
      break;
    }

    after = prospects?.pageInfo?.hasNextPage
      ? prospects.pageInfo.endCursor
      : undefined;

    if (after === undefined) {
      break;
    }
  }

  return summary;
};

const readWriteLimit = (payload: unknown): number | undefined => {
  const raw = (payload as { limit?: unknown } | null | undefined)?.limit;

  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0
    ? Math.floor(raw)
    : undefined;
};

const handler = async (payload?: unknown): Promise<CrispSyncSummary> => {
  const settings = readCrispSettings();

  if (!settings.enabled) {
    return {
      checked: 0,
      linked: 0,
      empty: 0,
      skipped: 0,
      failed: [],
      completed: true,
      disabled: true as const,
    };
  }

  if (resolveCrispWebsiteIds({ settings }).length === 0) {
    throw new Error(
      'No Crisp website is configured. Add CRISP_WEBSITE_ID_BLOY, CRISP_WEBSITE_ID_MIDA or the CRISP_WEBSITE_ID fallback under Settings > Apps > BD Prospects > Variables.',
    );
  }

  const credentials = readCrispCredentials();
  const client: ApiClient = new CoreApiClient();
  const startedAt = Date.now();

  return syncCrispConversations({
    client,
    credentials,
    settings,
    writeLimit: readWriteLimit(payload),
    shouldStop: () => Date.now() - startedAt > TIME_BUDGET_MS,
  });
};

export default defineLogicFunction({
  universalIdentifier: SYNC_CRISP_LOGIC_FUNCTION_UID,
  name: 'sync-crisp-conversations',
  description:
    'Daily cron: searches Crisp for each stale prospect’s conversation by domain and fills the Crisp Chat and Email PIC columns.',
  timeoutSeconds: 600,
  cronTriggerSettings: {
    pattern: '0 2 * * *',
  },
  handler,
});
