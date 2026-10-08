import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { COMPLETE_SPRINT_ROUTE_PATH } from '../constants/route-paths';
import { COMPLETE_SPRINT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { buildDefaultSprintName } from '../utils/build-default-sprint-name.util';
import { pickSprintFamiliesToMove } from '../utils/pick-sprint-families-to-move.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import { fetchSprint } from './utils/fetch-sprint.util';
import { listDoneStatusIds } from './utils/list-done-status-ids.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CompleteSprintBody = {
  sprintId?: string;
  // Where unfinished issues go: another open sprint, or the backlog (null).
  targetSprintId?: string | null;
  // A sprint created for them, named like Jira's "<KEY> Sprint <n>".
  createNewSprint?: boolean;
  // Counts what would move without changing anything, for the dialog.
  dryRun?: boolean;
};

type SprintIssue = {
  id: string;
  statusId?: string | null;
  parentId?: string | null;
};

const createFollowUpSprint = async ({
  client,
  projectId,
}: {
  client: ApiClient;
  projectId: string;
}): Promise<string> => {
  const [projectKey, sprints, appId] = await Promise.all([
    fetchRecordColumn(client, 'projects', projectId, 'key'),
    listScopedRecords<{ name?: string | null }>({
      client,
      pluralName: 'sprints',
      filter: { projectId: { eq: projectId } },
      selection: { id: true, name: true },
    }),
    resolveEffectiveAppId({
      client,
      objectNameSingular: 'sprint',
      immediateForeignKeyValue: projectId,
    }),
  ]);

  const result = await client.mutation({
    createSprint: {
      __args: {
        data: {
          name: buildDefaultSprintName({
            projectKey,
            existingNames: sprints.map((sprint) => sprint.name),
          }),
          state: 'FUTURE',
          projectId,
          appId,
          position: 'last',
        },
      },
      id: true,
    },
  });

  const sprintId = (result?.createSprint as { id?: string } | undefined)?.id;

  if (typeof sprintId !== 'string') {
    throw new Error('The new sprint could not be created.');
  }

  return sprintId;
};

// Closes the active sprint and moves its unfinished work on, family by
// family, so a parent and its subtasks never end up in different sprints.
// Done issues stay in the closed sprint as its record.
const handler = async (event: RoutePayload<CompleteSprintBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const sprintId = requireString(event.body?.sprintId, 'sprintId');
    const shouldCreateNewSprint = event.body?.createNewSprint === true;
    const requestedTargetSprintId = event.body?.targetSprintId ?? null;

    if (shouldCreateNewSprint && requestedTargetSprintId !== null) {
      throw new Error('Pick either a sprint or a new sprint, not both.');
    }

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

    if (sprint.state !== 'ACTIVE') {
      throw new Error('Only the active sprint can be completed.');
    }

    const projectId = sprint.projectId;

    if (requestedTargetSprintId !== null) {
      const targetSprint = await fetchSprint(client, requestedTargetSprintId);

      if (
        targetSprint === null ||
        targetSprint.projectId !== projectId ||
        targetSprint.id === sprintId ||
        targetSprint.state === 'CLOSED'
      ) {
        throw new Error('Pick an open sprint of the same project.');
      }
    }

    const [doneStatusIds, issues] = await Promise.all([
      listDoneStatusIds({ client, projectId }),
      listScopedRecords<SprintIssue>({
        client,
        pluralName: 'issues',
        filter: { sprintId: { eq: sprintId } },
        selection: { id: true, statusId: true, parentId: true },
      }),
    ]);
    const movedIssueIds = pickSprintFamiliesToMove({ issues, doneStatusIds });
    const counts = {
      movedIssueCount: movedIssueIds.length,
      stayingIssueCount: issues.length - movedIssueIds.length,
    };

    if (event.body?.dryRun === true) {
      return counts;
    }

    const targetSprintId =
      shouldCreateNewSprint && movedIssueIds.length > 0
        ? await createFollowUpSprint({ client, projectId })
        : requestedTargetSprintId;

    for (const issueId of movedIssueIds) {
      await client.mutation({
        updateIssue: {
          __args: { id: issueId, data: { sprintId: targetSprintId } },
          id: true,
        },
      });
    }

    await client.mutation({
      updateSprint: {
        __args: {
          id: sprintId,
          data: { state: 'CLOSED', completeDate: new Date().toISOString() },
        },
        id: true,
      },
    });

    return { ...counts, targetSprintId };
  });

export default defineLogicFunction({
  universalIdentifier: COMPLETE_SPRINT_LOGIC_FUNCTION_UID,
  name: 'complete-sprint',
  description:
    'Route: closes the active sprint and moves its unfinished issues, with their subtasks, to the backlog, another sprint or a new one.',
  timeoutSeconds: 120,
  httpRouteTriggerSettings: {
    path: COMPLETE_SPRINT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
