import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { WorkspaceCacheProvider } from 'src/engine/workspace-cache/interfaces/workspace-cache-provider.service';

import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import {
  type AllObjectRecordsRoleFlagsByRoleId,
  type AppScopeGrantsByMemberId,
  type AppScopeGrantsCacheData,
  type AppScopeOperation,
} from 'src/engine/twenty-orm/types/app-scope-permission.type';
import { WorkspaceCache } from 'src/engine/workspace-cache/decorators/workspace-cache.decorator';
import { type WorkspaceCacheProviderContext } from 'src/engine/workspace-cache/types/workspace-cache-provider-context.type';
import { type WorkspaceCacheRowsRequirement } from 'src/engine/workspace-cache/types/workspace-cache-rows-requirement.type';
import { AppAccessWorkspaceEntity } from 'src/modules/app-access/standard-objects/app-access.workspace-entity';

// The `appAccess.permissions` MULTI_SELECT field stores these uppercase option
// values; the rest of the app-scope enforcement code works with the lowercase
// AppScopeOperation values instead, so this is the single place normalizing between them.
const APP_SCOPE_OPERATION_BY_PERMISSION_OPTION_VALUE: Record<
  string,
  AppScopeOperation
> = {
  READ: 'read',
  WRITE: 'write',
  SOFT_DELETE: 'softDelete',
  DESTROY: 'destroy',
};

const APP_SCOPE_GRANTS_ROWS_REQUIREMENT = {
  role: true,
} as const satisfies WorkspaceCacheRowsRequirement;

@Injectable()
@WorkspaceCache('appScopeGrants', { packingPonderation: 1 })
export class WorkspaceAppGrantsCacheService extends WorkspaceCacheProvider<AppScopeGrantsCacheData> {
  override readonly rowsRequirement = APP_SCOPE_GRANTS_ROWS_REQUIREMENT;

  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {
    super();
  }

  async computeForCache({
    workspaceId,
    rows,
  }: WorkspaceCacheProviderContext<
    typeof APP_SCOPE_GRANTS_ROWS_REQUIREMENT
  >): Promise<AppScopeGrantsCacheData> {
    const grantsByMemberId = await this.computeGrantsByMemberId(workspaceId);
    const allObjectRecordsRoleFlagsByRoleId =
      this.computeAllObjectRecordsRoleFlagsByRoleId(rows.role);

    return { grantsByMemberId, allObjectRecordsRoleFlagsByRoleId };
  }

  private async computeGrantsByMemberId(
    workspaceId: string,
  ): Promise<AppScopeGrantsByMemberId> {
    // `appAccess` is a workspace-schema standard object (like `project`/`issue`),
    // not a core-schema entity — it has no static TypeORM repository to inject,
    // so it's read through WorkspaceOrmManager the same way pre-query hooks
    // do bypass-permission lookups. `{ lite: true }` is enough here: we only need
    // object metadata to resolve the repository, not permissions/role maps (and
    // using the full context here would recursively re-request this very cache key).
    const appAccessRecords =
      await this.workspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const appAccessRepository = this.workspaceOrmManager.getRepository(
            AppAccessWorkspaceEntity,
            { shouldBypassPermissionChecks: true },
          );

          return appAccessRepository.find();
        },
        buildSystemAuthContext(workspaceId),
        { lite: true },
      );

    const grantsByMemberId: AppScopeGrantsByMemberId = {};

    for (const appAccessRecord of appAccessRecords) {
      const { memberId, appId, permissions } = appAccessRecord;

      if (!isDefined(memberId) || !isDefined(appId)) {
        continue;
      }

      const grantsByAppId = (grantsByMemberId[memberId] ??= {});
      const grantedPermissions = (grantsByAppId[appId] ??= []);

      for (const permission of permissions ?? []) {
        const operation =
          APP_SCOPE_OPERATION_BY_PERMISSION_OPTION_VALUE[permission];

        if (isDefined(operation) && !grantedPermissions.includes(operation)) {
          grantedPermissions.push(operation);
        }
      }
    }

    return grantsByMemberId;
  }

  private computeAllObjectRecordsRoleFlagsByRoleId(
    roles: WorkspaceCacheProviderContext<
      typeof APP_SCOPE_GRANTS_ROWS_REQUIREMENT
    >['rows']['role'],
  ): AllObjectRecordsRoleFlagsByRoleId {
    const allObjectRecordsRoleFlagsByRoleId: AllObjectRecordsRoleFlagsByRoleId =
      {};

    for (const role of roles) {
      allObjectRecordsRoleFlagsByRoleId[role.id] = {
        read: role.canReadAllObjectRecords,
        write: role.canUpdateAllObjectRecords,
        softDelete: role.canSoftDeleteAllObjectRecords,
        destroy: role.canDestroyAllObjectRecords,
      };
    }

    return allObjectRecordsRoleFlagsByRoleId;
  }
}
