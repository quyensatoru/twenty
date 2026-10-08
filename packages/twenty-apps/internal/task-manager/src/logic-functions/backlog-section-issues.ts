import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { BACKLOG_SECTION_ISSUES_ROUTE_PATH } from '../constants/route-paths';
import { BACKLOG_SECTION_ISSUES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import {
  fetchBacklogSectionPage,
  listSubtaskCounts,
} from './utils/fetch-backlog-section.util';
import { fetchSprint } from './utils/fetch-sprint.util';
import { listDoneStatusIds } from './utils/list-done-status-ids.util';
import { listIssueMembers } from './utils/list-issue-members.util';
import {
  type BoardIssueQueryBody,
  readBoardIssueQuery,
} from './utils/read-board-issue-query.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type BacklogSectionIssuesBody = BoardIssueQueryBody & {
  projectId?: string;
  // The section's sprint, or null for the backlog.
  sectionSprintId?: string | null;
  after?: string;
};

// The next page of one backlog section, with the same filters as the first.
const handler = async (event: RoutePayload<BacklogSectionIssuesBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');
    const after = requireString(event.body?.after, 'after');
    const sprintId =
      typeof event.body?.sectionSprintId === 'string'
        ? event.body.sectionSprintId
        : null;

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'read',
    });

    if (sprintId !== null) {
      const sprint = await fetchSprint(client, sprintId);

      if (sprint === null || sprint.projectId !== projectId) {
        throw new Error('This sprint does not belong to the project.');
      }
    }

    const doneStatusIds = await listDoneStatusIds({ client, projectId });
    const page = await fetchBacklogSectionPage({
      client,
      query: { ...readBoardIssueQuery(projectId, event.body), sprintId },
      sprintId,
      doneStatusIds,
      after,
    });
    const [members, subtaskCountByIssueId] = await Promise.all([
      listIssueMembers({ client, issues: page.issues }),
      listSubtaskCounts({
        client,
        parentIds: page.issues.map((issue) => issue.id),
      }),
    ]);

    return { ...page, members, subtaskCountByIssueId };
  });

export default defineLogicFunction({
  universalIdentifier: BACKLOG_SECTION_ISSUES_LOGIC_FUNCTION_UID,
  name: 'backlog-section-issues',
  description: 'Route: the next page of one backlog section.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: BACKLOG_SECTION_ISSUES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
