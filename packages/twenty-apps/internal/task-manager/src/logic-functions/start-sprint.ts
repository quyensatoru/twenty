import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SPRINT_SELECTION } from '../constants/record-selections';
import { START_SPRINT_ROUTE_PATH } from '../constants/route-paths';
import { START_SPRINT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type SprintStartProblem,
  validateSprintStart,
} from '../utils/validate-sprint-start.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { countIssues } from './utils/count-issues.util';
import { fetchSprint } from './utils/fetch-sprint.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type StartSprintBody = {
  sprintId?: string;
  name?: string;
  goal?: string | null;
  startDate?: string;
  endDate?: string;
};

const readProblemMessage = (
  problem: SprintStartProblem,
  activeSprintName: string | null,
): string => {
  switch (problem) {
    case 'NOT_FUTURE':
      return 'Only a future sprint can be started.';
    case 'ANOTHER_ACTIVE':
      return `${activeSprintName ?? 'Another sprint'} is already active. Complete it first.`;
    case 'NO_ISSUES':
      return 'Add at least one issue before starting the sprint.';
    case 'MISSING_DATES':
      return 'A sprint needs a start date and an end date.';
    case 'END_BEFORE_START':
      return 'The end date must be after the start date.';
  }
};

// One active sprint per project, as on a Jira board. Checked here rather than
// in the dialog: two people pressing Start at once both pass a client check.
const handler = async (event: RoutePayload<StartSprintBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const sprintId = requireString(event.body?.sprintId, 'sprintId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'sprint',
      recordId: sprintId,
      operation: 'write',
    });

    const sprint = await fetchSprint(client, sprintId);

    if (sprint === null || typeof sprint.projectId !== 'string') {
      throw new Error(`Sprint ${sprintId} not found`);
    }

    const [issueCount, otherActiveSprints] = await Promise.all([
      countIssues(client, { sprintId: { eq: sprintId } }),
      listScopedRecords<{ id: string; name?: string | null }>({
        client,
        pluralName: 'sprints',
        filter: {
          projectId: { eq: sprint.projectId },
          state: { eq: 'ACTIVE' },
          id: { neq: sprintId },
        },
        selection: { id: true, name: true },
      }),
    ]);

    const problem = validateSprintStart({
      state: sprint.state,
      issueCount,
      otherActiveSprintCount: otherActiveSprints.length,
      startDate: event.body?.startDate,
      endDate: event.body?.endDate,
    });

    if (problem !== null) {
      throw new Error(
        readProblemMessage(problem, otherActiveSprints[0]?.name ?? null),
      );
    }

    const name =
      typeof event.body?.name === 'string' ? event.body.name.trim() : '';
    const goal = event.body?.goal;

    const result = await client.mutation({
      updateSprint: {
        __args: {
          id: sprintId,
          data: {
            state: 'ACTIVE',
            startDate: event.body?.startDate,
            endDate: event.body?.endDate,
            ...(name === '' ? {} : { name }),
            ...(goal === undefined ? {} : { goal }),
          },
        },
        ...SPRINT_SELECTION,
      },
    });

    return { sprint: result?.updateSprint };
  });

export default defineLogicFunction({
  universalIdentifier: START_SPRINT_LOGIC_FUNCTION_UID,
  name: 'start-sprint',
  description:
    'Route: starts a future sprint, refusing while another sprint of the project is active.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: START_SPRINT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
