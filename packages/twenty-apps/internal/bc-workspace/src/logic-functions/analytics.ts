import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ANALYTICS_ROUTE_PATH } from '../constants/route-paths';
import { ANALYTICS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  buildAnalyticsResult,
  buildTeamComparison,
} from '../utils/analytics-result.util';
import { loadAnalyticsContext } from './utils/analytics-data.util';
import { runBcRoute } from './utils/run-bc-route.util';
import { indexMemberNames } from './utils/workspace-members.util';

const handler = async (event: RoutePayload<Record<string, unknown>>) =>
  runBcRoute(async ({ client, scope }) => {
    const context = await loadAnalyticsContext({
      client,
      scope,
      body: event.body,
    });
    const memberNames = indexMemberNames(context.workspaceMembers);

    return {
      analytics: buildAnalyticsResult({
        request: context.request,
        period: context.period,
        memberIds: context.memberIds,
        computation: context.computation,
        finance: context.finance,
        clients: context.clients,
        memberNames,
        teamComparison:
          context.teamMemberIds === null
            ? null
            : buildTeamComparison({
                dataset: context.dataset,
                teamMemberIds: context.teamMemberIds,
                memberNames,
              }),
        baseCurrency: context.baseCurrency,
      }),
    };
  });

export default defineLogicFunction({
  universalIdentifier: ANALYTICS_LOGIC_FUNCTION_UID,
  name: 'bc-analytics',
  description:
    "Route: balanced BC KPIs for the caller's own work or their team over a reporting period, with manager-only financials.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: ANALYTICS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
