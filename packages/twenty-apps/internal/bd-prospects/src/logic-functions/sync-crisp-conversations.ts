import { defineLogicFunction } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { SELLABLE_APP_KEYS } from '../constants/registered-apps';
import { SYNC_CRISP_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection, type ProspectRow } from '../utils/api-types';
import {
  resolveCrispMatches,
  type CrispAuthError,
  type CrispMatch,
} from '../utils/crisp-search';
import { executeWithRetry } from '../utils/execute-with-retry';
import {
  hasAnyCrispWorkspace,
  readCrispSettings,
  resolveCrispWorkspaces,
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
  // Prospects left for a later run because one of their apps' workspaces
  // rejected its credentials.
  blocked: number;
  failed: string[];
  workspaceErrors: string[];
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

const labelOf = (match: CrispMatch): string =>
  `${match.appKey}: ${match.nickname ?? match.email ?? 'Crisp conversation'}`;

const writeMatches = async ({
  client,
  prospectId,
  matches,
}: {
  client: ApiClient;
  prospectId: string;
  matches: CrispMatch[];
}): Promise<void> => {
  const [primary, ...rest] = matches;
  const emails = [
    ...new Set(
      matches
        .map((match) => match.email)
        .filter((email): email is string => typeof email === 'string'),
    ),
  ];
  const [primaryEmail, ...additionalEmails] = emails;

  await executeWithRetry(() =>
    client.mutation({
      updateProspect: {
        __args: {
          id: prospectId,
          data: {
            crispChat: {
              primaryLinkUrl: primary.url,
              primaryLinkLabel: labelOf(primary),
              secondaryLinks: rest.map((match) => ({
                url: match.url,
                label: labelOf(match),
              })),
            },
            // Null clears a stale address: the links above are the only
            // conversations this column may describe.
            crispEmail:
              primaryEmail === undefined
                ? null
                : { primaryEmail, additionalEmails },
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
  settings,
  prospect,
  summary,
  brokenWebsiteIds,
}: {
  client: ApiClient;
  settings: CrispSettings;
  prospect: SyncProspectRow;
  summary: CrispSyncSummary;
  brokenWebsiteIds: Set<string>;
}): Promise<void> => {
  const domain = prospect.domain?.trim().toLowerCase() ?? '';

  // No domain, nothing to search: stamp so the batch stops picking it up.
  if (domain.length === 0) {
    await stampChecked(client, prospect.id);
    summary.skipped += 1;
    return;
  }

  const workspaces = resolveCrispWorkspaces({
    ourApps: prospect.ourApps,
    settings,
  });

  if (workspaces.length === 0) {
    await stampChecked(client, prospect.id);
    summary.skipped += 1;
    return;
  }

  const { matches, blockedAppKeys } = await resolveCrispMatches({
    workspaces,
    domain,
    shopName: prospect.shopName,
    brokenWebsiteIds,
    onAuthFailure: (appKey: string, error: CrispAuthError) => {
      summary.workspaceErrors.push(`${appKey}: ${error.message}`);
    },
  });

  // Not stamped, so the shop is searched again once the workspace is fixed.
  if (blockedAppKeys.length > 0) {
    summary.blocked += 1;
    return;
  }

  if (matches.length === 0) {
    // Miss: columns stay as they are per spec for never-found rows, and a
    // previously found link is left untouched: text search is fuzzy and a
    // miss must not wipe a good link. Stamp so a miss is not re-searched
    // until it goes stale.
    await stampChecked(client, prospect.id);
    summary.empty += 1;
    return;
  }

  await writeMatches({ client, prospectId: prospect.id, matches });
  summary.linked += 1;
};

export const syncCrispConversations = async ({
  client,
  settings,
  prospectId,
  writeLimit,
  shouldStop = () => false,
}: {
  client: ApiClient;
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
    blocked: 0,
    failed: [],
    workspaceErrors: [],
    completed: true,
  };
  const brokenWebsiteIds = new Set<string>();

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
      await syncOne({ client, settings, prospect, summary, brokenWebsiteIds });
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
            filter: { ourApps: { containsAny: SELLABLE_APP_KEYS } },
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

      const blockedBefore = summary.blocked;

      try {
        await syncOne({ client, settings, prospect, summary, brokenWebsiteIds });
      } catch (error) {
        // One bad prospect must not fail the batch. Rate limiting aborts the
        // whole run instead of burning through prospects that would all fail
        // the same way; a broken workspace is handled per app in syncOne.
        const message = error instanceof Error ? error.message : String(error);

        if (/HTTP 429/.test(message)) {
          throw error;
        }

        summary.failed.push(`${prospect.id}: ${message}`);
      }

      // Blocked rows stay unstamped at the head of the queue, so counting them
      // against the write limit would make every run re-read the same rows.
      if (summary.blocked === blockedBefore) {
        summary.checked += 1;
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
      blocked: 0,
      failed: [],
      workspaceErrors: [],
      completed: true,
      disabled: true as const,
    };
  }

  if (!hasAnyCrispWorkspace(settings)) {
    throw new Error(
      'No Crisp workspace is configured. Add one triple per app (CRISP_API_IDENTIFIER_<APP>, CRISP_API_KEY_<APP>, CRISP_WEBSITE_ID_<APP>) or the fallback triple under Settings > Apps > BD Prospects > Variables.',
    );
  }

  const client: ApiClient = new CoreApiClient();
  const startedAt = Date.now();

  return syncCrispConversations({
    client,
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
