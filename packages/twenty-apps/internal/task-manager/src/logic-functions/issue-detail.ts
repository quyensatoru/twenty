import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  ISSUE_COMMENT_SELECTION,
  ISSUE_SELECTION,
  ISSUE_STATUS_SELECTION,
  MERCHANT_SELECTION,
  WORKLOG_SELECTION,
} from '../constants/record-selections';
import { ISSUE_DETAIL_ROUTE_PATH } from '../constants/route-paths';
import { ISSUE_DETAIL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection } from '../types/connection';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type IssueDetailBody = { issueId?: string };

const handler = async (event: RoutePayload<IssueDetailBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueId = requireString(event.body?.issueId, 'issueId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issue',
      recordId: issueId,
      operation: 'read',
    });

    const issueResult = await client.query({
      issues: {
        __args: { filter: { id: { eq: issueId } }, first: 1 },
        edges: { node: ISSUE_SELECTION },
      },
    });

    const issueConnection = issueResult?.issues as
      | Connection<{
          id: string;
          projectId?: string | null;
          assigneeId?: string | null;
          reporterId?: string | null;
        }>
      | undefined;
    const issue = issueConnection?.edges?.[0]?.node ?? null;

    if (issue === null) {
      return { issue: null };
    }

    const [issueComments, worklogs, issueMerchantLinks, issueStatuses] =
      await Promise.all([
        listScopedRecords<{ id: string; authorId?: string | null }>({
          client,
          pluralName: 'issueComments',
          filter: { issueId: { eq: issueId } },
          selection: ISSUE_COMMENT_SELECTION,
        }),
        listScopedRecords<{ id: string; memberId?: string | null }>({
          client,
          pluralName: 'worklogs',
          filter: { issueId: { eq: issueId } },
          selection: WORKLOG_SELECTION,
        }),
        listScopedRecords<{ merchantId: string }>({
          client,
          pluralName: 'issueMerchants',
          filter: { issueId: { eq: issueId } },
          selection: { id: true, merchantId: true },
        }),
        typeof issue.projectId === 'string'
          ? listScopedRecords({
              client,
              pluralName: 'issueStatuses',
              filter: { projectId: { eq: issue.projectId } },
              selection: ISSUE_STATUS_SELECTION,
              orderBy: [{ position: 'AscNullsLast' }],
            })
          : Promise.resolve([]),
      ]);

    const merchantIds = issueMerchantLinks.map((link) => link.merchantId);
    const merchants =
      merchantIds.length === 0
        ? []
        : await listScopedRecords({
            client,
            pluralName: 'merchants',
            filter: { id: { in: merchantIds } },
            selection: MERCHANT_SELECTION,
          });

    // Names for every member the panel has to label: comment authors, worklog
    // owners, and the issue's own assignee and reporter. Resolved here so the
    // front component needs one round trip, not one per row.
    const memberIds = [
      ...new Set(
        [
          ...issueComments.map((comment) => comment.authorId),
          ...worklogs.map((worklog) => worklog.memberId),
          issue.assigneeId,
          issue.reporterId,
        ].filter((memberId): memberId is string => typeof memberId === 'string'),
      ),
    ];

    const members =
      memberIds.length === 0
        ? []
        : await listScopedRecords({
            client,
            pluralName: 'workspaceMembers',
            filter: { id: { in: memberIds } },
            selection: {
              id: true,
              name: { firstName: true, lastName: true },
              avatarUrl: true,
            },
          });

    return {
      issue,
      issueComments,
      worklogs,
      merchants,
      issueStatuses,
      members,
      // Who is asking. The panel decides which edit and delete controls to
      // offer from this; the routes re-check the same rule themselves, so a
      // wrong answer here can only hide a control, never authorise a write.
      currentWorkspaceMemberId: scope.workspaceMemberId,
    };
  });

export default defineLogicFunction({
  universalIdentifier: ISSUE_DETAIL_LOGIC_FUNCTION_UID,
  name: 'issue-detail',
  description:
    'Route: one issue with its comments, worklogs, merchant links and project statuses.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: ISSUE_DETAIL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
