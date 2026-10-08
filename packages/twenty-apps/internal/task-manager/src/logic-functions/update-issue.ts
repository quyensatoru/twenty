import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ISSUE_SELECTION } from '../constants/record-selections';
import { UPDATE_ISSUE_ROUTE_PATH } from '../constants/route-paths';
import { UPDATE_ISSUE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { buildIssueKey, hasIssueKey } from '../utils/build-issue-key.util';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { assertRelationTargetAppScope } from './app-scope/assert-relation-target-app-scope.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { assertIssuePlanningTargets } from './utils/assert-issue-planning-targets.util';
import { buildIssueRelationTargets } from './utils/build-issue-relation-targets.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import {
  applyPlanningToSubtasks,
  fetchIssuePlanning,
  pickPlanningChanges,
  SUBTASK_PLANNING_MESSAGE,
} from './utils/issue-planning.util';
import { linkIssueMerchants } from './utils/link-issue-merchants.util';
import { requireString } from './utils/require-string.util';
import { reserveProjectIssueNumbers } from './utils/reserve-project-issue-numbers.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type UpdateIssueBody = {
  issueId?: string;
  merchantIds?: string[];
  data?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<UpdateIssueBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueId = requireString(event.body?.issueId, 'issueId');
    const data = { ...(event.body?.data ?? {}) };
    const merchantIds = event.body?.merchantIds;

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issue',
      recordId: issueId,
      operation: 'write',
    });

    const projectId =
      typeof data.projectId === 'string' ? data.projectId : undefined;

    if (projectId !== undefined) {
      await assertAppScopeWriteAccess({
        client,
        scope,
        objectNameSingular: 'issue',
        foreignKeyValue: projectId,
      });

      // Moving an issue between projects can move it between apps, and the
      // row-level predicate reads the mirror, not the project chain.
      data.appId = await resolveEffectiveAppId({
        client,
        objectNameSingular: 'issue',
        immediateForeignKeyValue: projectId,
      });
    }

    const relationTargets = buildIssueRelationTargets({ ...data, merchantIds });

    if (relationTargets.length > 0) {
      // projectId is not necessarily part of this payload — fall back to the
      // record's current project so the guard still fires.
      const effectiveProjectId =
        projectId ??
        (await fetchRecordColumn(client, 'issues', issueId, 'projectId'));

      await assertRelationTargetAppScope({
        client,
        scope,
        objectNameSingular: 'issue',
        projectId: effectiveProjectId,
        targets: relationTargets,
      });
    }

    // Jira's rule: a subtask has no sprint or epic of its own. Changing its
    // parent re-homes it to the new parent's, and a direct change is refused.
    const isParentChange = Object.prototype.hasOwnProperty.call(
      data,
      'parentId',
    );
    const requestedPlanning = pickPlanningChanges(data);
    const isPlanningChange = Object.keys(requestedPlanning).length > 0;
    const parentId = isParentChange
      ? typeof data.parentId === 'string'
        ? data.parentId
        : null
      : isPlanningChange
        ? await fetchRecordColumn(client, 'issues', issueId, 'parentId')
        : null;

    if (parentId !== null) {
      if (!isParentChange) {
        throw new Error(SUBTASK_PLANNING_MESSAGE);
      }

      const parentPlanning = await fetchIssuePlanning(client, parentId);

      data.sprintId = parentPlanning?.sprintId ?? null;
      data.epicId = parentPlanning?.epicId ?? null;
    }

    if (typeof data.sprintId === 'string' || typeof data.epicId === 'string') {
      await assertIssuePlanningTargets({
        client,
        projectId:
          projectId ??
          (await fetchRecordColumn(client, 'issues', issueId, 'projectId')),
        sprintId: data.sprintId,
        epicId: data.epicId,
      });
    }

    // The key is generated once, on the project assignment that first makes it
    // possible.
    if (projectId !== undefined && !hasIssueKey(data.issueKey as string)) {
      const currentIssueKey = await fetchRecordColumn(
        client,
        'issues',
        issueId,
        'issueKey',
      );

      if (!hasIssueKey(currentIssueKey)) {
        const reservation = await reserveProjectIssueNumbers({
          client,
          projectId,
          count: 1,
        });

        if (reservation !== null) {
          data.issueKey = buildIssueKey(
            reservation.key,
            reservation.firstIssueNumber,
          );
        }
      }
    }

    const result = await client.mutation({
      updateIssue: { __args: { id: issueId, data }, ...ISSUE_SELECTION },
    });

    if (merchantIds !== undefined) {
      await linkIssueMerchants({ client, issueId, merchantIds });
    }

    if (parentId === null && isPlanningChange) {
      await applyPlanningToSubtasks({
        client,
        parentId: issueId,
        changes: requestedPlanning,
      });
    }

    return { issue: result?.updateIssue };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_ISSUE_LOGIC_FUNCTION_UID,
  name: 'update-issue',
  description:
    'Route: updates an issue, backfills its key on first project assignment and reconciles its merchant links.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: UPDATE_ISSUE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
