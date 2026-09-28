import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { COMPLETE_SPRINT_ROUTE_PATH } from '../constants/route-paths';
import { COMPLETE_SPRINT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { type Connection } from '../types/connection';
import { pickUnfinishedIssueIds } from '../utils/pick-unfinished-issue-ids.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

const ISSUE_PAGE_SIZE = 200;

type CompleteSprintBody = {
  sprintId?: string;
  targetSprintId?: string | null;
};

// Closes a sprint and moves its unfinished issues to another sprint of the
// same project, or back to the backlog when no target is given.
const handler = async (event: RoutePayload<CompleteSprintBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const sprintId = requireString(event.body?.sprintId, 'sprintId');
    const targetSprintId = event.body?.targetSprintId ?? null;

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'sprint',
      recordId: sprintId,
      operation: 'write',
    });

    const projectId = await fetchRecordColumn(
      client,
      'sprints',
      sprintId,
      'projectId',
    );

    if (projectId === null) {
      throw new Error(`Sprint ${sprintId} not found`);
    }

    if (targetSprintId !== null) {
      const targetProjectId = await fetchRecordColumn(
        client,
        'sprints',
        targetSprintId,
        'projectId',
      );

      if (targetProjectId !== projectId) {
        throw new Error('Target sprint must belong to the same project');
      }
    }

    const doneStatusIds = await listDoneStatusIds({ client, projectId });
    const issues = await listSprintIssues({ client, sprintId });
    const movedIssueIds = pickUnfinishedIssueIds({ issues, doneStatusIds });

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

    return { movedIssueCount: movedIssueIds.length };
  });

const listDoneStatusIds = async ({
  client,
  projectId,
}: {
  client: ApiClient;
  projectId: string;
}): Promise<string[]> => {
  const result = await client.query({
    issueStatuses: {
      __args: {
        filter: { projectId: { eq: projectId }, category: { eq: 'DONE' } },
        first: 100,
      },
      edges: { node: { id: true } },
    },
  });

  const connection = result?.issueStatuses as
    | Connection<{ id: string }>
    | undefined;

  return (connection?.edges ?? []).map((edge) => edge.node.id);
};

const listSprintIssues = async ({
  client,
  sprintId,
}: {
  client: ApiClient;
  sprintId: string;
}): Promise<{ id: string; statusId?: string | null }[]> => {
  const issues: { id: string; statusId?: string | null }[] = [];
  let after: string | undefined;

  for (;;) {
    const result = await client.query({
      issues: {
        __args: {
          filter: { sprintId: { eq: sprintId } },
          first: ISSUE_PAGE_SIZE,
          ...(after === undefined ? {} : { after }),
        },
        edges: { cursor: true, node: { id: true, statusId: true } },
      },
    });

    const connection = result?.issues as
      | {
          edges?: {
            cursor?: string;
            node: { id: string; statusId?: string | null };
          }[];
        }
      | undefined;
    const edges = connection?.edges ?? [];

    for (const edge of edges) {
      issues.push(edge.node);
    }

    if (edges.length < ISSUE_PAGE_SIZE) {
      return issues;
    }

    after = edges[edges.length - 1]?.cursor;

    if (after === undefined) {
      return issues;
    }
  }
};

export default defineLogicFunction({
  universalIdentifier: COMPLETE_SPRINT_LOGIC_FUNCTION_UID,
  name: 'complete-sprint',
  description:
    'Route: closes a sprint and moves its unfinished issues to the backlog or another sprint.',
  timeoutSeconds: 120,
  httpRouteTriggerSettings: {
    path: COMPLETE_SPRINT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
