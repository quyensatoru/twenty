import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CLIENT_SEARCH_ROUTE_PATH } from '../constants/route-paths';
import { CLIENT_SEARCH_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type VipClientRecord } from '../types/bc-records';
import { type ClientSearchResult } from '../types/tasks';
import { rankClientCandidates } from '../utils/task-client-search.util';
import { normalizeEmptyStrings } from './utils/normalize-record.util';
import { buildVisibleClientFilter } from './utils/resolve-bc-scope.util';
import { runBcRoute } from './utils/run-bc-route.util';
import {
  indexMemberNames,
  listWorkspaceMembers,
} from './utils/workspace-members.util';

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 20;
const CANDIDATE_LIMIT = 50;

// ILIKE wildcards in what was typed must match literally.
const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, '\\$&');

type SearchBody = { query?: string; limit?: number };

type CandidateNode = Pick<VipClientRecord, 'id' | 'name' | 'shopDomain' | 'picId'>;

// Two bounded queries per keystroke batch, never a full client load: names
// and domains starting with the text, then anything containing it, so an
// exact match is never pushed out by alphabetically earlier substrings.
const handler = async (event: RoutePayload<SearchBody>) =>
  runBcRoute(async ({ client, scope }) => {
    const query = (event.body?.query ?? '').trim();

    if (query.length < MIN_QUERY_LENGTH) {
      return { clients: [], hasMore: false } satisfies ClientSearchResult;
    }

    const limit = Math.min(Math.max(Number(event.body?.limit) || MAX_RESULTS, 1), MAX_RESULTS);
    const escaped = escapeLikePattern(query);
    const visibleFilter = buildVisibleClientFilter(scope);
    const searchClients = async (pattern: string): Promise<CandidateNode[]> => {
      const searchFilter = {
        or: [{ name: { ilike: pattern } }, { shopDomain: { ilike: pattern } }],
      };
      const result = await client.query({
        vipClients: {
          __args: {
            filter:
              visibleFilter === null
                ? searchFilter
                : { and: [visibleFilter, searchFilter] },
            first: CANDIDATE_LIMIT,
            orderBy: [{ name: 'AscNullsLast' }],
          },
          edges: { node: { id: true, name: true, shopDomain: true, picId: true } },
        },
      });

      return ((result?.vipClients?.edges ?? []) as { node: CandidateNode }[]).map(
        (edge) => normalizeEmptyStrings(edge.node),
      );
    };
    const [prefixMatches, substringMatches] = await Promise.all([
      searchClients(`${escaped}%`),
      searchClients(`%${escaped}%`),
    ]);
    const ranked = rankClientCandidates([...prefixMatches, ...substringMatches], query);
    const nodes = ranked.slice(0, limit);
    const memberNames =
      nodes.some((node) => node.picId !== null)
        ? indexMemberNames(await listWorkspaceMembers(client))
        : new Map<string, string>();

    const response: ClientSearchResult = {
      clients: nodes.map((node) => ({
        id: node.id,
        name: node.name,
        shopDomain: node.shopDomain,
        picName: node.picId === null ? null : (memberNames.get(node.picId) ?? null),
      })),
      hasMore: ranked.length > limit || substringMatches.length >= CANDIDATE_LIMIT,
    };

    return response;
  });

export default defineLogicFunction({
  universalIdentifier: CLIENT_SEARCH_LOGIC_FUNCTION_UID,
  name: 'bc-client-search',
  description:
    'Route: VIP clients the caller may see whose name or Shopify domain matches what was typed.',
  timeoutSeconds: 15,
  httpRouteTriggerSettings: {
    path: CLIENT_SEARCH_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
