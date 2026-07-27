import { isDefined } from 'twenty-shared/utils';

import { isApiKeyAuthContext } from 'src/engine/core-modules/auth/guards/is-api-key-auth-context.guard';
import { isApplicationAuthContext } from 'src/engine/core-modules/auth/guards/is-application-auth-context.guard';
import { isSystemAuthContext } from 'src/engine/core-modules/auth/guards/is-system-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type UserWorkspaceRoleMap } from 'src/engine/metadata-modules/role-target/types/user-workspace-role-map';
import {
  type AllObjectRecordsRoleFlagsByRoleId,
  type AppScopeOperation,
} from 'src/engine/twenty-orm/types/app-scope-permission.type';
import { resolveRoleIdFromAuthContext } from 'src/engine/twenty-orm/utils/resolve-role-id-from-auth-context.util';

// Three independent checks — any one true bypasses app-scope enforcement entirely
// (the member still goes through Twenty's normal Role permission checks separately):
// 1. a `system` auth context (internal jobs/crons)
// 2. an `apiKey`/`application` auth context (machine contexts — deliberate business
//    rule, not automatic)
// 3. the acting role's RAW `canXAllObjectRecords` flag for this operation — NOT the
//    computed per-object permission, which can't be told apart from an explicit
//    narrow per-object grant
export const shouldBypassAppScope = ({
  authContext,
  operation,
  allObjectRecordsRoleFlagsByRoleId,
  userWorkspaceRoleMap,
  apiKeyRoleMap,
}: {
  authContext: WorkspaceAuthContext;
  operation: AppScopeOperation;
  allObjectRecordsRoleFlagsByRoleId: AllObjectRecordsRoleFlagsByRoleId;
  userWorkspaceRoleMap: UserWorkspaceRoleMap;
  apiKeyRoleMap: Record<string, string>;
}): boolean => {
  if (isSystemAuthContext(authContext)) {
    return true;
  }

  if (
    isApiKeyAuthContext(authContext) ||
    isApplicationAuthContext(authContext)
  ) {
    return true;
  }

  const roleId = resolveRoleIdFromAuthContext({
    authContext,
    userWorkspaceRoleMap,
    apiKeyRoleMap,
  });

  if (!isDefined(roleId)) {
    return false;
  }

  return allObjectRecordsRoleFlagsByRoleId[roleId]?.[operation] === true;
};
