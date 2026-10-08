import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { BOARD_COLUMN_PAGE_SIZE } from '../constants/board-column-page-size';
import { BOARD_COLUMN_ISSUES_ROUTE_PATH } from '../constants/route-paths';
import { BOARD_COLUMN_ISSUES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection } from '../types/connection';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import {
  buildBoardColumnFilter,
  buildBoardScopeFilter,
} from './utils/build-board-issue-filters.util';
import { fetchIssuePage } from './utils/fetch-issue-page.util';
import { findActiveSprintId } from './utils/find-active-sprint-id.util';
import { listIssueMembers } from './utils/list-issue-members.util';
import {
  applyActiveSprint,
  type BoardIssueQueryBody,
  readBoardIssueQuery,
} from './utils/read-board-issue-query.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type BoardColumnIssuesBody = BoardIssueQueryBody & {
  projectId?: string;
  // null = the column of issues with no status.
  statusId?: string | null;
  // The column's endCursor from its previous page.
  after?: string;
};

// The next page of one board column, as the reader scrolls it. Same filters
// as the board's first read (task-board), so a column pages through exactly
// the issues the board counted for it.
const handler = async (event: RoutePayload<BoardColumnIssuesBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');
    const after = requireString(event.body?.after, 'after');
    const statusId =
      typeof event.body?.statusId === 'string' ? event.body.statusId : null;

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'read',
    });

    // The status decides the done window, and must be the project's own: a
    // status from elsewhere would page through another project's issues.
    let isDoneStatus = false;

    if (statusId !== null) {
      const statusResult = await client.query({
        issueStatuses: {
          __args: { filter: { id: { eq: statusId } }, first: 1 },
          edges: { node: { id: true, projectId: true, category: true } },
        },
      });
      const status = (
        statusResult?.issueStatuses as
          | Connection<{ projectId?: string | null; category?: string | null }>
          | undefined
      )?.edges?.[0]?.node;

      if (status === undefined || status.projectId !== projectId) {
        throw new Error('This status does not belong to the project.');
      }

      isDoneStatus = status.category === 'DONE';
    }

    const requestedQuery = readBoardIssueQuery(projectId, event.body);
    const query = applyActiveSprint(
      requestedQuery,
      requestedQuery.isActiveSprintRequested
        ? await findActiveSprintId({ client, projectId })
        : null,
    );
    const page = await fetchIssuePage({
      client,
      filter: buildBoardColumnFilter({
        scopeFilter: buildBoardScopeFilter(query),
        statusId,
        isDoneStatus,
        shouldIncludeOlderDone: query.shouldIncludeOlderDone,
        now: new Date(),
      }),
      first: BOARD_COLUMN_PAGE_SIZE,
      after,
    });

    const members = await listIssueMembers({ client, issues: page.issues });

    return { ...page, members };
  });

export default defineLogicFunction({
  universalIdentifier: BOARD_COLUMN_ISSUES_LOGIC_FUNCTION_UID,
  name: 'board-column-issues',
  description:
    'Route: the next page of one board column, with the members its cards label.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: BOARD_COLUMN_ISSUES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
