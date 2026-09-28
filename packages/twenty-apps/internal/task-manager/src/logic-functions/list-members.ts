import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { LIST_MEMBERS_ROUTE_PATH } from '../constants/route-paths';
import { LIST_MEMBERS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { listGrantedAppIds } from '../utils/list-granted-app-ids.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type ListMembersBody = { projectId?: string };

// Assignee and owner pickers must only offer members who themselves hold a
// grant on the project's app — the same rule assertRelationTargetAppScope
// enforces on write, surfaced ahead of time so the picker cannot produce a
// choice the write will reject.
const handler = async (event: RoutePayload<ListMembersBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');

    const appIdResult = await client.query({
      projects: {
        __args: { filter: { id: { eq: projectId } }, first: 1 },
        edges: { node: { id: true, appId: true } },
      },
    });

    const appId = appIdResult?.projects?.edges?.[0]?.node?.appId ?? null;

    if (appId === null) {
      return { members: [] };
    }

    if (
      !scope.canBypassAppScope &&
      !listGrantedAppIds(scope.grantsByAppId, 'read').includes(appId)
    ) {
      return { members: [] };
    }

    const grants = await listScopedRecords<{ memberId: string }>({
      client,
      pluralName: 'appAccesses',
      filter: { appId: { eq: appId } },
      selection: { id: true, memberId: true },
    });

    const memberIds = [...new Set(grants.map((grant) => grant.memberId))];

    if (memberIds.length === 0) {
      return { members: [] };
    }

    const members = await listScopedRecords({
      client,
      pluralName: 'workspaceMembers',
      filter: { id: { in: memberIds } },
      selection: {
        id: true,
        name: { firstName: true, lastName: true },
        userEmail: true,
        avatarUrl: true,
      },
    });

    return { members };
  });

export default defineLogicFunction({
  universalIdentifier: LIST_MEMBERS_LOGIC_FUNCTION_UID,
  name: 'list-members',
  description:
    "Route: workspace members holding a grant on a project's app, for assignee pickers.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: LIST_MEMBERS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
