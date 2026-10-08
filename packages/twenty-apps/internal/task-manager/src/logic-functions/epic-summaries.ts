import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { EPIC_SUMMARIES_ROUTE_PATH } from '../constants/route-paths';
import { EPIC_SUMMARIES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type EpicSummary } from '../types/task-board';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { countIssues } from './utils/count-issues.util';
import { listDoneStatusIds } from './utils/list-done-status-ids.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type EpicSummariesBody = { projectId?: string };

// Progress for the epic panel, apart from the board read so the board never
// waits on it: two counts per epic, side by side. A project's epics number in
// the tens, which keeps this cheaper than reading every issue's status.
const handler = async (event: RoutePayload<EpicSummariesBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'read',
    });

    const [epics, doneStatusIds] = await Promise.all([
      listScopedRecords<{ id: string }>({
        client,
        pluralName: 'epics',
        filter: { projectId: { eq: projectId } },
        selection: { id: true },
      }),
      listDoneStatusIds({ client, projectId }),
    ]);

    const summaries: EpicSummary[] = await Promise.all(
      epics.map(async (epic) => {
        const [totalCount, doneCount] = await Promise.all([
          countIssues(client, { epicId: { eq: epic.id } }),
          doneStatusIds.length === 0
            ? Promise.resolve(0)
            : countIssues(client, {
                epicId: { eq: epic.id },
                statusId: { in: doneStatusIds },
              }),
        ]);

        return { epicId: epic.id, doneCount, totalCount };
      }),
    );

    return { summaries };
  });

export default defineLogicFunction({
  universalIdentifier: EPIC_SUMMARIES_LOGIC_FUNCTION_UID,
  name: 'epic-summaries',
  description:
    "Route: done and total issue counts for each of a project's epics.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: EPIC_SUMMARIES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
