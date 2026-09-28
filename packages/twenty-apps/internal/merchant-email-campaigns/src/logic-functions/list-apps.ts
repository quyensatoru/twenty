import { defineLogicFunction } from 'twenty-sdk/define';

import { LIST_APPS_ROUTE_PATH } from '../constants/route-paths';
import { LIST_APPS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection } from '../types/connection';
import { executeWithRetry } from '../utils/execute-with-retry.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { createAppClient } from './utils/create-app-client.util';

// Served from here rather than read by the studio directly: `app` rows are
// app-scoped in this fork, so a member without grants would see an empty
// picker and could not target the apps a campaign actually reaches.
const handler = async () => {
  try {
    const { apps } = await executeWithRetry<{
      apps: Connection<{ id: string; name?: string | null }>;
    }>(() =>
      createAppClient().query({
        apps: {
          __args: { first: 200 },
          edges: { node: { id: true, name: true } },
        },
      }),
    );

    return {
      success: true,
      apps: (apps?.edges ?? [])
        .map(({ node }) => ({ id: node.id, name: node.name ?? '' }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: LIST_APPS_LOGIC_FUNCTION_UID,
  name: 'list-campaign-apps',
  description: 'Route: lists the apps a campaign audience can target.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: LIST_APPS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
