import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  PRODUCT_ITEM_LOGIC_FUNCTION_UID,
  PRODUCT_ITEM_ROUTE_PATH,
} from '../constants/product-backlog';
import { EPIC_SELECTION } from '../constants/record-selections';
import { type Connection } from '../types/connection';
import { type LinkedIssueSummary } from '../types/product-backlog';
import { readProductBacklogSettings } from '../utils/read-product-backlog-settings.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { hasAppGrant } from './app-scope/has-app-grant.util';
import { resolveRecordAppId } from './app-scope/resolve-record-app-id.util';
import { listDoneStatusIds } from './utils/list-done-status-ids.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { resolveProductBacklogAccess } from './utils/resolve-product-backlog-access.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type ProductItemBody = { issueId?: string };

// What the issue modal's Product panel needs beyond the issue itself: the
// project's backlog settings, its epics' goals and the issues it waits on.
const handler = async (event: RoutePayload<ProductItemBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueId = requireString(event.body?.issueId, 'issueId');
    const access = resolveProductBacklogAccess(scope);

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issue',
      recordId: issueId,
      operation: 'read',
    });

    if (access === 'NONE') {
      return { access };
    }

    const issueResult = await client.query({
      issues: {
        __args: { filter: { id: { eq: issueId } }, first: 1 },
        edges: {
          node: { id: true, projectId: true, blockedByIssueIds: true },
        },
      },
    });
    const issue = (
      issueResult?.issues as
        | Connection<{
            id: string;
            projectId?: string | null;
            blockedByIssueIds?: unknown;
          }>
        | undefined
    )?.edges?.[0]?.node;
    const projectId = issue?.projectId;

    if (typeof projectId !== 'string') {
      throw new Error(`Issue ${issueId} not found`);
    }

    const blockerIds = Array.isArray(issue?.blockedByIssueIds)
      ? issue.blockedByIssueIds.filter(
          (blockerId): blockerId is string => typeof blockerId === 'string',
        )
      : [];
    const [projectResult, epics, doneStatusIds, linkedIssues, appId] =
      await Promise.all([
        client.query({
          projects: {
            __args: { filter: { id: { eq: projectId } }, first: 1 },
            edges: { node: { id: true, productBacklogSettings: true } },
          },
        }),
        listScopedRecords({
          client,
          pluralName: 'epics',
          filter: { projectId: { eq: projectId } },
          selection: EPIC_SELECTION,
        }),
        listDoneStatusIds({ client, projectId }),
        blockerIds.length === 0
          ? Promise.resolve([])
          : listScopedRecords<LinkedIssueSummary>({
              client,
              pluralName: 'issues',
              filter: { id: { in: blockerIds } },
              selection: {
                id: true,
                issueKey: true,
                title: true,
                statusId: true,
                stage: true,
              },
            }),
        resolveRecordAppId({
          client,
          objectNameSingular: 'issue',
          recordId: issueId,
        }),
      ]);

    return {
      settings: readProductBacklogSettings(
        (
          projectResult?.projects as
            Connection<{ productBacklogSettings?: unknown }> | undefined
        )?.edges?.[0]?.node?.productBacklogSettings,
      ),
      epics,
      doneStatusIds,
      linkedIssues,
      access,
      canWrite: access === 'EDIT' && hasAppGrant(scope, appId, 'write'),
    };
  });

export default defineLogicFunction({
  universalIdentifier: PRODUCT_ITEM_LOGIC_FUNCTION_UID,
  name: 'product-item',
  description:
    "Route: an item's backlog settings, epics and blockers for the issue modal's Product panel.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: PRODUCT_ITEM_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
