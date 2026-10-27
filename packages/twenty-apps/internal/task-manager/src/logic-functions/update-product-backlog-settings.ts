import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  UPDATE_PRODUCT_BACKLOG_SETTINGS_LOGIC_FUNCTION_UID,
  UPDATE_PRODUCT_BACKLOG_SETTINGS_ROUTE_PATH,
} from '../constants/product-backlog';
import { type Connection } from '../types/connection';
import {
  readProductBacklogMigratedAt,
  readProductBacklogSettings,
} from '../utils/read-product-backlog-settings.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { requireString } from './utils/require-string.util';
import { assertProductBacklogEditor } from './utils/resolve-product-backlog-access.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type UpdateProductBacklogSettingsBody = {
  projectId?: string;
  // Only the keys sent change; the rest keep their stored value.
  settings?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<UpdateProductBacklogSettingsBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    assertProductBacklogEditor(scope);

    const projectId = requireString(event.body?.projectId, 'projectId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'write',
    });

    const result = await client.query({
      projects: {
        __args: { filter: { id: { eq: projectId } }, first: 1 },
        edges: { node: { id: true, productBacklogSettings: true } },
      },
    });
    const stored = (
      result?.projects as
        Connection<{ id: string; productBacklogSettings?: unknown }> | undefined
    )?.edges?.[0]?.node?.productBacklogSettings;
    const settings = readProductBacklogSettings({
      ...readProductBacklogSettings(stored),
      ...(event.body?.settings ?? {}),
    });

    await client.mutation({
      updateProject: {
        __args: {
          id: projectId,
          data: {
            productBacklogSettings: {
              ...settings,
              migratedAt: readProductBacklogMigratedAt(stored),
            },
          },
        },
        id: true,
      },
    });

    return { settings };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_PRODUCT_BACKLOG_SETTINGS_LOGIC_FUNCTION_UID,
  name: 'update-product-backlog-settings',
  description:
    "Route: changes a project's strategic goals, Definition of Ready or prioritization template.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: UPDATE_PRODUCT_BACKLOG_SETTINGS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
