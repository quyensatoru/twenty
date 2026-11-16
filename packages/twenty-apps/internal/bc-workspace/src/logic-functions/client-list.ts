import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CLIENT_LIST_ROUTE_PATH } from '../constants/route-paths';
import { CLIENT_LIST_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type ClientListRequest,
  type ClientListResult,
} from '../types/dashboard';
import {
  buildClientRow,
  buildPlanOptions,
  countKpis,
  matchesClientFilters,
  readClientSortValue,
} from '../utils/dashboard-rows.util';
import {
  paginate,
  readSortState,
  sortRecords,
} from '../utils/sort-records.util';
import {
  groupByVipClientId,
  listClientMerchants,
  listOpenIssues,
  listVisibleVipClients,
} from './utils/client-store.util';
import {
  listClientReviews,
  loadLatestConversationByMerchant,
  loadPaidMerchantIds,
  loadPlanCatalog,
} from './utils/dashboard-data.util';
import { runBcRoute } from './utils/run-bc-route.util';
import {
  indexMemberNames,
  listWorkspaceMembers,
} from './utils/workspace-members.util';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const readNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

const readRequest = (body: Partial<ClientListRequest> | null | undefined): ClientListRequest => ({
  search: typeof body?.search === 'string' ? body.search : '',
  appName: readNullableString(body?.appName),
  plan: readNullableString(body?.plan),
  picId: readNullableString(body?.picId),
  status: (readNullableString(body?.status) as ClientListRequest['status']) ?? null,
  appHealth: (readNullableString(body?.appHealth) as ClientListRequest['appHealth']) ?? null,
  review: (readNullableString(body?.review) as ClientListRequest['review']) ?? null,
  kpi: body?.kpi ?? 'ALL',
  sort: readSortState(body?.sort),
  page: Number(body?.page) || 1,
  pageSize: Math.min(Math.max(Number(body?.pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE),
});

const handler = async (event: RoutePayload<Partial<ClientListRequest>>) =>
  runBcRoute(async ({ client, scope }) => {
    const request = readRequest(event.body);
    const vipClients = await listVisibleVipClients(client, scope);
    const vipClientIds = vipClients.map((vipClient) => vipClient.id);

    const [merchants, openIssues, reviews, members, planCatalog] = await Promise.all([
      listClientMerchants(client, vipClientIds),
      listOpenIssues(client, vipClientIds),
      listClientReviews(client, vipClientIds),
      listWorkspaceMembers(client),
      loadPlanCatalog(client),
    ]);
    const merchantIds = merchants.map((merchant) => merchant.id);
    const [conversationsByMerchant, paidMerchantIds] = await Promise.all([
      loadLatestConversationByMerchant(client, merchantIds),
      loadPaidMerchantIds(client, merchantIds, planCatalog),
    ]);

    const merchantsByClient = groupByVipClientId(merchants);
    const issuesByClient = groupByVipClientId(openIssues);
    const reviewsByClient = groupByVipClientId(reviews);
    const memberNames = indexMemberNames(members);

    const rows = vipClients.map((vipClient) => {
      const clientMerchants = merchantsByClient.get(vipClient.id) ?? [];

      return buildClientRow({
        vipClient,
        merchants: clientMerchants,
        openIssues: issuesByClient.get(vipClient.id) ?? [],
        reviews: reviewsByClient.get(vipClient.id) ?? [],
        memberNames,
        planCatalog,
        paidMerchantIds,
        conversationsByMerchant,
      });
    });

    const filtered = rows.filter((row) => matchesClientFilters(row, request));
    const sorted = sortRecords(
      filtered,
      request.sort,
      (row, key) => readClientSortValue(row, key, request.appName),
      { key: 'lastBcContact', direction: 'DESC' },
    );
    const page = paginate(sorted, request.page, request.pageSize);

    const result: ClientListResult = {
      rows: page.items,
      kpis: countKpis(rows),
      page: page.page,
      pageCount: page.pageCount,
      total: page.total,
      planOptions: buildPlanOptions({ rows, planCatalog, appName: request.appName }),
    };

    return result;
  });

export default defineLogicFunction({
  universalIdentifier: CLIENT_LIST_LOGIC_FUNCTION_UID,
  name: 'bc-client-list',
  description:
    'Route: one row per VIP client with per-app plan, health and review, filtered, sorted and paged on the server.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: CLIENT_LIST_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
