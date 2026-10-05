import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  EPIC_SELECTION,
  ISSUE_COMMENT_SELECTION,
  ISSUE_HISTORY_SELECTION,
  ISSUE_SELECTION,
  ISSUE_STATUS_SELECTION,
  LINKED_ISSUE_SELECTION,
  MERCHANT_SELECTION,
  SPRINT_SELECTION,
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
          parentId?: string | null;
        }>
      | undefined;
    const issue = issueConnection?.edges?.[0]?.node ?? null;

    if (issue === null) {
      return { issue: null };
    }

    const parentId =
      typeof issue.parentId === 'string' ? issue.parentId : null;

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

    // The Subtasks widget: the parent row and the children rows, oldest first.
    // Scoped like everything else on this page, so a linked issue outside the
    // caller's apps simply does not come back.
    const [parentIssue, childIssues] = await Promise.all([
      parentId === null
        ? Promise.resolve(null)
        : listScopedRecords({
            client,
            pluralName: 'issues',
            filter: { id: { eq: parentId } },
            selection: LINKED_ISSUE_SELECTION,
          }).then((rows) => rows[0] ?? null),
      listScopedRecords<{ id: string; assigneeId?: string | null }>({
        client,
        pluralName: 'issues',
        filter: { parentId: { eq: issueId } },
        selection: LINKED_ISSUE_SELECTION,
        orderBy: [{ createdAt: 'AscNullsLast' }],
      }),
    ]);

    // Options for the relation pickers the app draws itself, narrowed to the
    // issue's own project. The host's FIELDS widget cannot narrow them: it
    // queries the target object with the viewer's token, so the row-level
    // predicate trims them to the caller's apps and no further, and an app has
    // no way to declare a filter on a relation field.
    const [sprints, epics] =
      typeof issue.projectId === 'string'
        ? await Promise.all([
            listScopedRecords({
              client,
              pluralName: 'sprints',
              filter: { projectId: { eq: issue.projectId } },
              selection: SPRINT_SELECTION,
              orderBy: [{ position: 'AscNullsLast' }],
            }),
            listScopedRecords({
              client,
              pluralName: 'epics',
              filter: { projectId: { eq: issue.projectId } },
              selection: EPIC_SELECTION,
              orderBy: [{ position: 'AscNullsLast' }],
            }),
          ])
        : [[], []];

    // Oldest first: the feed reads top-down, creation then each change.
    const issueHistories = await listScopedRecords<{
      id: string;
      authorId?: string | null;
    }>({
      client,
      pluralName: 'issueHistories',
      filter: { issueId: { eq: issueId } },
      selection: ISSUE_HISTORY_SELECTION,
      orderBy: [{ createdAt: 'AscNullsLast' }],
    });

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
    // owners, history actors, the issue's own assignee and reporter, and the
    // owners of its child issues. Resolved here so the front component needs
    // one round trip, not one per row.
    const memberIds = [
      ...new Set(
        [
          ...issueComments.map((comment) => comment.authorId),
          ...worklogs.map((worklog) => worklog.memberId),
          ...issueHistories.map((history) => history.authorId),
          ...childIssues.map((child) => child.assigneeId),
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
              // What the feed's author hover card shows under the name: two
              // people with the same first name are the same 24px circle.
              userEmail: true,
            },
          });

    return {
      issue,
      issueComments,
      worklogs,
      issueHistories,
      merchants,
      issueStatuses,
      sprints,
      epics,
      members,
      parentIssue,
      childIssues,
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
    'Route: one issue with its comments, worklogs, history, merchant links, parent and children, and project statuses.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: ISSUE_DETAIL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
