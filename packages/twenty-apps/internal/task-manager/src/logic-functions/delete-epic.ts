import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DELETE_EPIC_ROUTE_PATH } from '../constants/route-paths';
import { DELETE_EPIC_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { clearIssueRelation } from './utils/clear-issue-relation.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type DeleteEpicBody = { epicId?: string };

// The issues stay; they only lose their epic, as when an epic is deleted in
// Jira without moving its children elsewhere.
const handler = async (event: RoutePayload<DeleteEpicBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const epicId = requireString(event.body?.epicId, 'epicId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'epic',
      recordId: epicId,
      operation: 'softDelete',
    });

    const clearedIssueCount = await clearIssueRelation({
      client,
      columnName: 'epicId',
      recordId: epicId,
    });

    await client.mutation({
      deleteEpic: { __args: { id: epicId }, id: true },
    });

    return { deletedEpicId: epicId, clearedIssueCount };
  });

export default defineLogicFunction({
  universalIdentifier: DELETE_EPIC_LOGIC_FUNCTION_UID,
  name: 'delete-epic',
  description: 'Route: deletes an epic and clears it from its issues.',
  timeoutSeconds: 120,
  httpRouteTriggerSettings: {
    path: DELETE_EPIC_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
