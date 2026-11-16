import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DEV_TASK_LINK_ROUTE_PATH } from '../constants/route-paths';
import { DEV_TASK_LINK_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { recordActivity } from './utils/activity-store.util';
import { loadScopedVipClient } from './utils/client-store.util';
import { assertCanEditClient } from './utils/dashboard-data.util';
import { findFirstRecord } from './utils/record-store.util';
import { requireString } from './utils/require-string.util';
import { runBcRoute } from './utils/run-bc-route.util';

type LinkBody = {
  vipClientId?: string;
  issueId?: string;
  appName?: string | null;
  bcIssueId?: string | null;
};

// Called after Task Manager created the issue, so the client timeline points
// at it. Closing that developer task never closes the BC issue.
const handler = async (event: RoutePayload<LinkBody>) =>
  runBcRoute(async ({ client, scope }) => {
    const vipClient = await loadScopedVipClient({
      client,
      scope,
      vipClientId: requireString(event.body?.vipClientId, 'vipClientId'),
    });

    assertCanEditClient(scope, vipClient);

    const issueId = requireString(event.body?.issueId, 'issueId');
    const developerIssue = await findFirstRecord<{
      id: string;
      title: string | null;
      issueKey: string | null;
    }>({
      client,
      objectNamePlural: 'issues',
      filter: { id: { eq: issueId } },
      selection: { id: true, title: true, issueKey: true },
    });

    if (developerIssue === null) {
      throw new Error('The developer task was not found in Task Manager.');
    }

    const label = [developerIssue.issueKey, developerIssue.title]
      .filter((part) => typeof part === 'string' && part.length > 0)
      .join(' ');
    const { activity } = await recordActivity(client, {
      vipClientId: vipClient.id,
      type: 'DEVELOPER_TASK',
      title: `Developer task created: ${label}`,
      direction: 'INTERNAL',
      topic: event.body?.bcIssueId ? 'ISSUE' : 'GENERAL',
      actorMemberId: scope.workspaceMemberId,
      appName: event.body?.appName ?? null,
      developerIssueId: developerIssue.id,
      externalId: `developer-task:${developerIssue.id}`,
      metadata: { bcIssueId: event.body?.bcIssueId ?? null },
    });

    return { activityId: activity.id };
  });

export default defineLogicFunction({
  universalIdentifier: DEV_TASK_LINK_LOGIC_FUNCTION_UID,
  name: 'bc-dev-task-link',
  description:
    "Route: records a Task Manager developer task created for a client on the client's timeline.",
  timeoutSeconds: 20,
  httpRouteTriggerSettings: {
    path: DEV_TASK_LINK_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
