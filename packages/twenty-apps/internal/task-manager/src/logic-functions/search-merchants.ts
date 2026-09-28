import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { MERCHANT_SELECTION } from '../constants/record-selections';
import { SEARCH_MERCHANTS_ROUTE_PATH } from '../constants/route-paths';
import { SEARCH_MERCHANTS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { listGrantedAppIds } from '../utils/list-granted-app-ids.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

const MERCHANT_RESULT_LIMIT = 50;

type SearchMerchantsBody = {
  projectId?: string;
  search?: string;
};

// `merchant` is an app-scope root of its own, so the candidate set is the
// merchants of the project's app — never every merchant in the workspace.
const handler = async (event: RoutePayload<SearchMerchantsBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');
    const search = event.body?.search ?? '';

    const projectResult = await client.query({
      projects: {
        __args: { filter: { id: { eq: projectId } }, first: 1 },
        edges: { node: { id: true, appId: true } },
      },
    });

    const appId = projectResult?.projects?.edges?.[0]?.node?.appId ?? null;

    if (appId === null) {
      return { merchants: [] };
    }

    if (
      !scope.canBypassAppScope &&
      !listGrantedAppIds(scope.grantsByAppId, 'read').includes(appId)
    ) {
      return { merchants: [] };
    }

    const merchants = await listScopedRecords({
      client,
      pluralName: 'merchants',
      filter: {
        appId: { eq: appId },
        ...(search.length === 0 ? {} : { name: { ilike: `%${search}%` } }),
      },
      selection: MERCHANT_SELECTION,
      pageSize: MERCHANT_RESULT_LIMIT,
      maxRecords: MERCHANT_RESULT_LIMIT,
    });

    return { merchants };
  });

export default defineLogicFunction({
  universalIdentifier: SEARCH_MERCHANTS_LOGIC_FUNCTION_UID,
  name: 'search-merchants',
  description:
    "Route: merchants of a project's app, for the issue merchant picker.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SEARCH_MERCHANTS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
