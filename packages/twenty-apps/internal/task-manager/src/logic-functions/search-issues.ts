import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  ISSUE_SEARCH_SELECTION,
  ISSUE_STATUS_SELECTION,
  PROJECT_SELECTION,
} from '../constants/record-selections';
import { SEARCH_ISSUES_ROUTE_PATH } from '../constants/route-paths';
import { SEARCH_ISSUES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type IssueRow } from '../types/task-manager-rows';
import { buildProjectScopeFilter } from './app-scope/build-project-scope-filter.util';
import { listVisibleProjectIds } from './app-scope/list-visible-project-ids.util';
import { listIssueMembers } from './utils/list-issue-members.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

const SEARCH_RESULT_LIMIT = 50;

type SearchIssuesBody = { search?: string };

const EMPTY_RESULT = {
  issues: [],
  projects: [],
  issueStatuses: [],
  members: [],
  hasMore: false,
};

// The board and the backlog filter their own project's issues in the browser.
// This route is the other half the fork had for free: a key-or-title search
// across EVERY project the caller may read, not just the one on screen. The
// candidate set is the same visible-project set every other read narrows to,
// so a match can never leak a project the caller has no grant for.
const handler = async (event: RoutePayload<SearchIssuesBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const search = (event.body?.search ?? '').trim();

    if (search === '') {
      return EMPTY_RESULT;
    }

    const visibleProjectIds = await listVisibleProjectIds({
      client,
      scope,
      operation: 'read',
    });

    if (visibleProjectIds !== null && visibleProjectIds.length === 0) {
      return EMPTY_RESULT;
    }

    const term = `%${search}%`;

    // One page of limit + 1: the extra row is never rendered, it only tells the
    // caller the result set was truncated.
    const matches = await listScopedRecords<IssueRow>({
      client,
      pluralName: 'issues',
      filter: {
        ...buildProjectScopeFilter(visibleProjectIds),
        or: [{ issueKey: { ilike: term } }, { title: { ilike: term } }],
      },
      selection: ISSUE_SEARCH_SELECTION,
      orderBy: [{ updatedAt: 'DescNullsLast' }],
      pageSize: SEARCH_RESULT_LIMIT + 1,
      maxRecords: SEARCH_RESULT_LIMIT + 1,
    });

    const hasMore = matches.length > SEARCH_RESULT_LIMIT;
    const issues = hasMore ? matches.slice(0, SEARCH_RESULT_LIMIT) : matches;

    const matchedProjectIds = [
      ...new Set(
        issues
          .map((issue) => issue.projectId)
          .filter((projectId): projectId is string => typeof projectId === 'string'),
      ),
    ];
    const matchedStatusIds = [
      ...new Set(
        issues
          .map((issue) => issue.statusId)
          .filter((statusId): statusId is string => typeof statusId === 'string'),
      ),
    ];

    const [projects, issueStatuses, members] = await Promise.all([
      matchedProjectIds.length === 0
        ? Promise.resolve([])
        : listScopedRecords({
            client,
            pluralName: 'projects',
            filter: { id: { in: matchedProjectIds } },
            selection: PROJECT_SELECTION,
          }),
      matchedStatusIds.length === 0
        ? Promise.resolve([])
        : listScopedRecords({
            client,
            pluralName: 'issueStatuses',
            filter: { id: { in: matchedStatusIds } },
            selection: ISSUE_STATUS_SELECTION,
          }),
      listIssueMembers({ client, issues }),
    ]);

    return { issues, projects, issueStatuses, members, hasMore };
  });

export default defineLogicFunction({
  universalIdentifier: SEARCH_ISSUES_LOGIC_FUNCTION_UID,
  name: 'search-issues',
  description:
    'Route: issues matching a key or title term across every project the caller may read.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SEARCH_ISSUES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
