import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { UPDATE_ISSUE_VIEW_SETTINGS_ROUTE_PATH } from '../constants/route-paths';
import { UPDATE_ISSUE_VIEW_SETTINGS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection } from '../types/connection';
import { readIssueViewSettings } from '../utils/read-issue-view-settings.util';
import { AppScopePermissionDeniedError } from './app-scope/app-scope-error';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type UpdateIssueViewSettingsBody = {
  projectId?: string;
  hiddenDetailFields?: unknown;
  hiddenCardFields?: unknown;
};

// Which fields a project's issues show, in the Details panel and on board
// cards, for everyone on the project. A view edit, so the role's "Manage
// Views" decides, as it does for the column order. A list left out keeps its
// stored value, so the board and the issue panel each save only their own
// list and cannot put back a stale copy of the other's.
const handler = async (event: RoutePayload<UpdateIssueViewSettingsBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');

    if (!scope.canManageViews) {
      throw new AppScopePermissionDeniedError();
    }

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'read',
    });

    const result = await client.query({
      projects: {
        __args: { filter: { id: { eq: projectId } }, first: 1 },
        edges: { node: { id: true, issueViewSettings: true } },
      },
    });
    const stored = readIssueViewSettings(
      (
        result.projects as
          | Connection<{ id: string; issueViewSettings?: unknown }>
          | undefined
      )?.edges?.[0]?.node?.issueViewSettings,
    );
    const issueViewSettings = readIssueViewSettings({
      hiddenDetailFields:
        event.body?.hiddenDetailFields ?? stored.hiddenDetailFields,
      hiddenCardFields: event.body?.hiddenCardFields ?? stored.hiddenCardFields,
    });

    await client.mutation({
      updateProject: {
        __args: { id: projectId, data: { issueViewSettings } },
        id: true,
      },
    });

    return { issueViewSettings };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_ISSUE_VIEW_SETTINGS_LOGIC_FUNCTION_UID,
  name: 'update-issue-view-settings',
  description:
    "Route: sets which fields a project's issues show in their Details panel and on board cards.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: UPDATE_ISSUE_VIEW_SETTINGS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
