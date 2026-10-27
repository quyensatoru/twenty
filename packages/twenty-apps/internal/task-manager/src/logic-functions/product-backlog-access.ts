import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  PRODUCT_BACKLOG_EDITOR_ROLES_VARIABLE,
  PRODUCT_BACKLOG_HIDDEN_ROLES_VARIABLE,
} from '../constants/application-variables';
import {
  PRODUCT_BACKLOG_ACCESS_LOGIC_FUNCTION_UID,
  PRODUCT_BACKLOG_ACCESS_ROUTE_PATH,
} from '../constants/product-backlog';
import { APPLICATION_UID } from '../constants/universal-identifiers';
import { type CallerRole } from '../types/caller-scope';
import {
  isRoleListed,
  readProductBacklogRoleEntries,
} from '../utils/read-product-backlog-access.util';
import { AppScopePermissionDeniedError } from './app-scope/app-scope-error';
import { runScopedRoute } from './utils/run-scoped-route.util';

type ProductBacklogAccessBody = {
  // Sent to save; omitted to only read the current choice.
  editorRoleIds?: string[];
  hiddenRoleIds?: string[];
};

const readRoleIds = (value: unknown): string[] | null =>
  Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string')
    : null;

// Variables are read once per run from process.env, so a value saved here is
// echoed back as saved instead of re-read.
const handler = async (event: RoutePayload<ProductBacklogAccessBody>) =>
  runScopedRoute(async ({ scope }) => {
    if (!scope.canBypassAppScope || scope.workspaceMemberId === null) {
      throw new AppScopePermissionDeniedError();
    }

    const metadataClient = new MetadataApiClient();
    const result = (await metadataClient.query({
      getRoles: {
        id: true,
        label: true,
        applicationId: true,
        canBeAssignedToUsers: true,
      },
      currentWorkspace: { workspaceCustomApplicationId: true },
      findOneApplication: {
        __args: { universalIdentifier: APPLICATION_UID },
        id: true,
      },
    })) as {
      getRoles?: {
        id?: string;
        label?: string;
        applicationId?: string;
        canBeAssignedToUsers?: boolean;
      }[];
      currentWorkspace?: { workspaceCustomApplicationId?: string } | null;
      findOneApplication?: { id?: string } | null;
    };
    // Only roles made in Settings > Roles: other apps install runtime roles,
    // and the built-in Admin always edits.
    const customApplicationId =
      result.currentWorkspace?.workspaceCustomApplicationId;
    const roles: CallerRole[] = (result.getRoles ?? []).flatMap((role) =>
      typeof role.id === 'string' &&
      role.canBeAssignedToUsers !== false &&
      role.applicationId === customApplicationId
        ? [{ id: role.id, label: role.label ?? '' }]
        : [],
    );
    const editorRoleIds = readRoleIds(event.body?.editorRoleIds);
    const hiddenRoleIds = readRoleIds(event.body?.hiddenRoleIds);

    if (editorRoleIds !== null && hiddenRoleIds !== null) {
      const applicationId = result.findOneApplication?.id;

      if (typeof applicationId !== 'string') {
        throw new Error('Could not find the Task Manager application.');
      }

      for (const [key, ids] of [
        [PRODUCT_BACKLOG_EDITOR_ROLES_VARIABLE, editorRoleIds],
        [PRODUCT_BACKLOG_HIDDEN_ROLES_VARIABLE, hiddenRoleIds],
      ] as const) {
        await metadataClient.mutation({
          updateOneApplicationVariable: {
            __args: { applicationId, key, value: ids.join(',') },
          },
        });
      }

      return { roles, editorRoleIds, hiddenRoleIds };
    }

    const listedIds = (value: string | undefined) => {
      const entries = readProductBacklogRoleEntries(value);

      return roles
        .filter((role) => isRoleListed(role, entries))
        .map((role) => role.id);
    };

    return {
      roles,
      editorRoleIds: listedIds(
        process.env[PRODUCT_BACKLOG_EDITOR_ROLES_VARIABLE],
      ),
      hiddenRoleIds: listedIds(
        process.env[PRODUCT_BACKLOG_HIDDEN_ROLES_VARIABLE],
      ),
    };
  });

export default defineLogicFunction({
  universalIdentifier: PRODUCT_BACKLOG_ACCESS_LOGIC_FUNCTION_UID,
  name: 'product-backlog-access',
  description:
    'Route: admins read or choose which workspace roles may change the Product Backlog and which may not see it.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: PRODUCT_BACKLOG_ACCESS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
