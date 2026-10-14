import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  ISSUE_SEARCH_SELECTION,
  ISSUE_STATUS_SELECTION,
} from '../constants/record-selections';
import { MERCHANT_PREVIEW_ROUTE_PATH } from '../constants/route-paths';
import { MERCHANT_PREVIEW_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { type CallerScope } from '../types/caller-scope';
import { type IssueRow } from '../types/task-manager-rows';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { buildProjectScopeFilter } from './app-scope/build-project-scope-filter.util';
import { listVisibleProjectIds } from './app-scope/list-visible-project-ids.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type MerchantPreviewBody = {
  merchantId?: string;
};

const MAX_ISSUES = 50;

const readLinkedIssues = async ({
  client,
  scope,
  merchantId,
}: {
  client: ApiClient;
  scope: CallerScope;
  merchantId: string;
}) => {
  const links = await listScopedRecords<{ issueId?: string | null }>({
    client,
    pluralName: 'issueMerchants',
    filter: { merchantId: { eq: merchantId } },
    selection: { id: true, issueId: true },
    maxRecords: MAX_ISSUES,
  });
  const issueIds = [
    ...new Set(
      links
        .map((link) => link.issueId)
        .filter((issueId): issueId is string => typeof issueId === 'string'),
    ),
  ];

  if (issueIds.length === 0) {
    return [];
  }

  const visibleProjectIds = await listVisibleProjectIds({
    client,
    scope,
    operation: 'read',
  });

  if (visibleProjectIds !== null && visibleProjectIds.length === 0) {
    return [];
  }

  const issues = await listScopedRecords<IssueRow>({
    client,
    pluralName: 'issues',
    filter: {
      ...buildProjectScopeFilter(visibleProjectIds),
      id: { in: issueIds },
    },
    selection: ISSUE_SEARCH_SELECTION,
    orderBy: [{ updatedAt: 'DescNullsLast' }],
  });
  const statusIds = [
    ...new Set(
      issues
        .map((issue) => issue.statusId)
        .filter((statusId): statusId is string => typeof statusId === 'string'),
    ),
  ];
  const statuses =
    statusIds.length === 0
      ? []
      : await listScopedRecords<{
          id: string;
          name?: string | null;
          color?: string | null;
        }>({
          client,
          pluralName: 'issueStatuses',
          filter: { id: { in: statusIds } },
          selection: ISSUE_STATUS_SELECTION,
        });
  const statusesById = new Map(statuses.map((status) => [status.id, status]));

  return issues.map((issue) => {
    const status =
      typeof issue.statusId === 'string'
        ? statusesById.get(issue.statusId)
        : undefined;

    return {
      id: issue.id,
      issueKey: issue.issueKey ?? null,
      title: issue.title ?? null,
      statusName: status?.name ?? null,
      statusColor: status?.color ?? null,
    };
  });
};

const handler = async (event: RoutePayload<MerchantPreviewBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const merchantId = requireString(event.body?.merchantId, 'merchantId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'merchant',
      recordId: merchantId,
      operation: 'read',
    });

    return { issues: await readLinkedIssues({ client, scope, merchantId }) };
  });

export default defineLogicFunction({
  universalIdentifier: MERCHANT_PREVIEW_LOGIC_FUNCTION_UID,
  name: 'merchant-preview',
  description:
    "Route: the issues linked to a merchant that the caller may read, for the issue modal's merchant preview.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: MERCHANT_PREVIEW_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
