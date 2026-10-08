import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SPRINT_SELECTION } from '../constants/record-selections';
import { BACKLOG_ROUTE_PATH } from '../constants/route-paths';
import { BACKLOG_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { BACKLOG_SECTION_KEY, type BacklogSection } from '../types/backlog';
import { type BoardIssue, type BoardSprint } from '../types/task-board';
import { orderBacklogSprints } from '../utils/order-backlog-sprints.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import {
  fetchBacklogSectionPage,
  fetchBacklogSectionTotals,
  listSubtaskCounts,
} from './utils/fetch-backlog-section.util';
import { listDoneStatusIds } from './utils/list-done-status-ids.util';
import { listIssueMembers } from './utils/list-issue-members.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import {
  type BoardIssueQueryBody,
  readBoardIssueQuery,
} from './utils/read-board-issue-query.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type BacklogBody = BoardIssueQueryBody & { projectId?: string };

// One round trip for the backlog view: the open sprints in order, then the
// first page and the totals of every section, one per sprint plus the
// backlog. The project list, statuses, epics and permissions come from the
// task-board read the page already makes.
const handler = async (event: RoutePayload<BacklogBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'read',
    });

    const query = {
      ...readBoardIssueQuery(projectId, event.body),
      sprintId: undefined,
    };
    const [sprints, doneStatusIds] = await Promise.all([
      listScopedRecords<BoardSprint>({
        client,
        pluralName: 'sprints',
        filter: {
          projectId: { eq: projectId },
          or: [
            { state: { in: ['ACTIVE', 'FUTURE'] } },
            { state: { is: 'NULL' } },
          ],
        },
        selection: SPRINT_SELECTION,
        orderBy: [{ position: 'AscNullsLast' }],
      }),
      listDoneStatusIds({ client, projectId }),
    ]);
    const orderedSprints = orderBacklogSprints(sprints);
    const sectionSprintIds: (string | null)[] = [
      ...orderedSprints.map((sprint) => sprint.id),
      null,
    ];

    const sections: BacklogSection[] = await Promise.all(
      sectionSprintIds.map(async (sprintId) => {
        const [page, totals] = await Promise.all([
          fetchBacklogSectionPage({ client, query, sprintId, doneStatusIds }),
          fetchBacklogSectionTotals({ client, query, sprintId, doneStatusIds }),
        ]);

        return {
          key: sprintId ?? BACKLOG_SECTION_KEY,
          sprintId,
          issues: page.issues as BoardIssue[],
          totalCount: page.totalCount,
          unfilteredCount: totals.unfilteredCount,
          storyPointTotal: totals.storyPointTotal,
          endCursor: page.endCursor,
          hasNextPage: page.hasNextPage,
        };
      }),
    );

    const issues = sections.flatMap((section) => section.issues);
    const [members, subtaskCountByIssueId] = await Promise.all([
      listIssueMembers({ client, issues }),
      listSubtaskCounts({ client, parentIds: issues.map((issue) => issue.id) }),
    ]);

    return {
      sprints: orderedSprints,
      sections,
      members,
      subtaskCountByIssueId,
    };
  });

export default defineLogicFunction({
  universalIdentifier: BACKLOG_LOGIC_FUNCTION_UID,
  name: 'backlog',
  description:
    "Route: a project's open sprints and backlog, each with its first page of top-level issues and its totals.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: BACKLOG_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
