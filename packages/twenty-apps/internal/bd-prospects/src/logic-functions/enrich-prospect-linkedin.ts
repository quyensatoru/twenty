import { defineLogicFunction } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { SERPER_API_KEY_VARIABLE } from '../constants/application-variable-names';
import { ENRICH_PROSPECT_LINKEDIN_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type Connection,
  type ProspectRow,
} from '../utils/api-types';
import { buildLinkedinQueries } from '../utils/build-linkedin-queries';
import { executeWithRetry } from '../utils/execute-with-retry';
import { readEnrichSettings } from '../utils/read-enrich-settings';
import { scoreLinkedinCandidates } from '../utils/score-linkedin-candidates';
import { serperSearch } from '../utils/serper-search';

type ApiClient = any;

// Oldest-unchecked first, a small page per run: Serper's quota is monthly, so
// the batch spreads the work instead of rescanning everything every night.
const PROSPECTS_PER_RUN = 20;
const STALE_AFTER_DAYS = 30;
const MAX_QUERIES_PER_PROSPECT = 4;
// Stops well before the 600s hard timeout, same shape as the merchant sync.
const TIME_BUDGET_MS = 480_000;

const prospectSelection = {
  id: true,
  domain: true,
  shopName: true,
  email: { primaryEmail: true },
  linkedinCheckedAt: true,
} as const;

export type EnrichSummary = {
  checked: number;
  enriched: number;
  empty: number;
  skipped: number;
  failed: string[];
  disabled?: true;
};

type EnrichmentProspectRow = Pick<
  ProspectRow,
  'id' | 'domain' | 'email'
> & {
  shopName?: string | null;
  linkedinCheckedAt?: string | null;
};

const readSerperApiKey = (): string => {
  const apiKey = process.env[SERPER_API_KEY_VARIABLE]?.trim();

  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    throw new Error(
      'SERPER_API_KEY is not set. Add it under Settings > Apps > BD Prospects > Variables.',
    );
  }

  return apiKey;
};

const isFresh = (checkedAt: string | null | undefined): boolean => {
  if (typeof checkedAt !== 'string' || checkedAt.length === 0) {
    return false;
  }

  const checkedTime = new Date(checkedAt).getTime();

  if (Number.isNaN(checkedTime)) {
    return false;
  }

  return Date.now() - checkedTime < STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
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
          data: { linkedinCheckedAt: new Date().toISOString() },
        },
        id: true,
      },
    }),
  );
};

const enrichOne = async ({
  client,
  apiKey,
  prospect,
  summary,
}: {
  client: ApiClient;
  apiKey: string;
  prospect: EnrichmentProspectRow;
  summary: EnrichSummary;
}): Promise<void> => {
  const domain = prospect.domain?.trim().toLowerCase() ?? '';

  // No domain, nothing to search: stamp so the batch stops picking it up.
  if (domain.length === 0) {
    await stampChecked(client, prospect.id);
    summary.skipped += 1;
    return;
  }

  const queries = buildLinkedinQueries({
    domain,
    shopName: prospect.shopName,
    email: prospect.email?.primaryEmail,
  }).slice(0, MAX_QUERIES_PER_PROSPECT);

  if (queries.length === 0) {
    await stampChecked(client, prospect.id);
    summary.skipped += 1;
    return;
  }

  const allResults = [];

  for (const query of queries) {
    const results = await serperSearch({ apiKey, query });
    allResults.push(...results);
  }

  const pages = scoreLinkedinCandidates({
    results: allResults,
    domain,
    shopName: prospect.shopName,
    email: prospect.email?.primaryEmail,
  });

  if (pages.length === 0) {
    // Miss: column stays blank per spec. Stamp so a miss is not re-searched
    // every run, and previously found links are left untouched.
    await stampChecked(client, prospect.id);
    summary.empty += 1;
    return;
  }

  const [primary, ...rest] = pages;

  await executeWithRetry(() =>
    client.mutation({
      updateProspect: {
        __args: {
          id: prospect.id,
          data: {
            linkedinPage: {
              primaryLinkUrl: primary.url,
              primaryLinkLabel: primary.title,
              secondaryLinks: rest.map((page) => ({
                url: page.url,
                label: page.title,
              })),
            },
            linkedinCheckedAt: new Date().toISOString(),
          },
        },
        id: true,
      },
    }),
  );
  summary.enriched += 1;
};

export const enrichProspectsLinkedin = async ({
  client,
  apiKey,
  prospectId,
  allowRecheck = true,
  shouldStop = () => false,
}: {
  client: ApiClient;
  apiKey: string;
  prospectId?: string;
  // False outside the re-check window: the batch then only drains
  // never-checked prospects and leaves the rest for the window run.
  allowRecheck?: boolean;
  shouldStop?: () => boolean;
}): Promise<EnrichSummary> => {
  const summary: EnrichSummary = {
    checked: 0,
    enriched: 0,
    empty: 0,
    skipped: 0,
    failed: [],
  };

  const { prospects } = await executeWithRetry<{
    prospects: Connection<EnrichmentProspectRow>;
  }>(() =>
    client.query({
      prospects: {
        __args:
          typeof prospectId === 'string'
            ? { filter: { id: { eq: prospectId } }, first: 1 }
            : {
                first: PROSPECTS_PER_RUN,
                orderBy: [{ linkedinCheckedAt: 'AscNullsFirst' }],
              },
        edges: { node: prospectSelection },
      },
    }),
  );

  for (const { node: prospect } of prospects?.edges ?? []) {
    if (shouldStop()) {
      break;
    }

    // A manual single-prospect run always re-checks. In the batch,
    // never-checked prospects always drain (they are the daily intake);
    // already-checked ones wait for the re-check window and must not be
    // fresh, so quota goes to real work.
    const isNew =
      typeof prospect.linkedinCheckedAt !== 'string' ||
      prospect.linkedinCheckedAt.length === 0;

    if (typeof prospectId !== 'string') {
      if (!isNew && !allowRecheck) {
        summary.skipped += 1;
        continue;
      }

      if (!isNew && isFresh(prospect.linkedinCheckedAt)) {
        summary.skipped += 1;
        continue;
      }
    }

    summary.checked += 1;

    try {
      await enrichOne({ client, apiKey, prospect, summary });
    } catch (error) {
      // One bad prospect must not fail the batch. Auth/quota errors abort the
      // whole run instead of burning through prospects that would all fail
      // the same way.
      const message = error instanceof Error ? error.message : String(error);

      if (/HTTP 401|HTTP 403|HTTP 429/.test(message)) {
        throw error;
      }

      summary.failed.push(`${prospect.id}: ${message}`);
    }
  }

  return summary;
};

const handler = async () => {
  const { enabled, recheckHour } = readEnrichSettings();

  if (!enabled) {
    return {
      checked: 0,
      enriched: 0,
      empty: 0,
      skipped: 0,
      failed: [],
      disabled: true as const,
    };
  }

  const client: ApiClient = new CoreApiClient();
  const apiKey = readSerperApiKey();
  const startedAt = Date.now();

  return enrichProspectsLinkedin({
    client,
    apiKey,
    // The cadence is frequent so new intake drains the same day; the daily
    // re-check of already-checked prospects only happens in its hour.
    allowRecheck: new Date().getUTCHours() === recheckHour,
    shouldStop: () => Date.now() - startedAt > TIME_BUDGET_MS,
  });
};

export default defineLogicFunction({
  universalIdentifier: ENRICH_PROSPECT_LINKEDIN_LOGIC_FUNCTION_UID,
  name: 'enrich-prospect-linkedin',
  description:
    'Cron: searches Serper for the LinkedIn company pages of stale prospects and fills the LinkedIn Page column.',
  timeoutSeconds: 600,
  cronTriggerSettings: {
    pattern: '*/30 * * * *',
  },
  handler,
});
