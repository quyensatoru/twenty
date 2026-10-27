import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  REORDER_ISSUES_LOGIC_FUNCTION_UID,
  REORDER_ISSUES_ROUTE_PATH,
} from '../constants/product-backlog';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { assertProductBacklogEditor } from './utils/resolve-product-backlog-access.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type ReorderIssuesBody = {
  projectId?: string;
  // The issues in their new order, best first.
  issueIds?: unknown;
};

const WRITE_BATCH_SIZE = 10;

// "Apply this order to the backlog": the listed issues swap the positions
// they already hold among themselves, so every issue outside the list keeps
// its place relative to them.
const handler = async (event: RoutePayload<ReorderIssuesBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    assertProductBacklogEditor(scope);

    const projectId = requireString(event.body?.projectId, 'projectId');
    const requestedIds = Array.isArray(event.body?.issueIds)
      ? event.body.issueIds.filter(
          (issueId): issueId is string => typeof issueId === 'string',
        )
      : [];

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'write',
    });

    const issues = await listScopedRecords<{
      id: string;
      position?: number | null;
    }>({
      client,
      pluralName: 'issues',
      filter: { id: { in: requestedIds }, projectId: { eq: projectId } },
      selection: { id: true, position: true },
    });
    const knownIds = new Set(issues.map((issue) => issue.id));
    const orderedIds = [...new Set(requestedIds)].filter((issueId) =>
      knownIds.has(issueId),
    );
    // Rows that share a position (old rows were created without one) are
    // nudged apart, or swapping slots between them would change nothing.
    const slots = issues
      .map((issue) => issue.position ?? 0)
      .sort((left, right) => left - right)
      .reduce<number[]>(
        (strictSlots, slot) => [
          ...strictSlots,
          strictSlots.length === 0
            ? slot
            : Math.max(slot, strictSlots[strictSlots.length - 1] + 0.001),
        ],
        [],
      );
    const positionById = new Map(
      issues.map((issue) => [issue.id, issue.position ?? 0]),
    );
    const changes = orderedIds
      .map((issueId, index) => ({ issueId, position: slots[index] }))
      .filter(
        ({ issueId, position }) => positionById.get(issueId) !== position,
      );

    for (let index = 0; index < changes.length; index += WRITE_BATCH_SIZE) {
      await Promise.all(
        changes
          .slice(index, index + WRITE_BATCH_SIZE)
          .map(({ issueId, position }) =>
            client.mutation({
              updateIssue: {
                __args: { id: issueId, data: { position } },
                id: true,
              },
            }),
          ),
      );
    }

    return { movedIssueCount: changes.length };
  });

export default defineLogicFunction({
  universalIdentifier: REORDER_ISSUES_LOGIC_FUNCTION_UID,
  name: 'reorder-issues',
  description:
    'Route: re-ranks a set of backlog items in the given order, keeping the positions they already hold.',
  timeoutSeconds: 120,
  httpRouteTriggerSettings: {
    path: REORDER_ISSUES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
