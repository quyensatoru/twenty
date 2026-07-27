import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { WorkspaceCacheProvider } from 'src/engine/workspace-cache/interfaces/workspace-cache-provider.service';

import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  type AllObjectRecordsRoleFlagsByRoleId,
  type AppScopeGrantsByMemberId,
  type AppScopeGrantsCacheData,
  type AppScopeOperation,
} from 'src/engine/twenty-orm/types/app-scope-permission.type';
import { WorkspaceCache } from 'src/engine/workspace-cache/decorators/workspace-cache.decorator';
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

@Injectable()
@WorkspaceCache('appScopeGrants')
export class WorkspaceAppGrantsCacheService extends WorkspaceCacheProvider<AppScopeGrantsCacheData> {
  constructor(
    @InjectWorkspaceScopedRepository(RoleEntity)
    private readonly roleRepository: WorkspaceScopedRepository<RoleEntity>,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {
    super();
  }

  async computeForCache(workspaceId: string): Promise<AppScopeGrantsCacheData> {
    const [grantsByMemberId, allObjectRecordsRoleFlagsByRoleId] =
      await Promise.all([
        this.computeGrantsByMemberId(workspaceId),
        this.computeAllObjectRecordsRoleFlagsByRoleId(workspaceId),
      ]);

    return { grantsByMemberId, allObjectRecordsRoleFlagsByRoleId };
  }

  private async computeGrantsByMemberId(
    workspaceId: string,
  ): Promise<AppScopeGrantsByMemberId> {
    // `appAccess` is a workspace-schema standard object (like `project`/`issue`),
    // not a core-schema entity — it has no static TypeORM repository to inject,
    // so it's read through GlobalWorkspaceOrmManager the same way pre-query hooks
    // do bypass-permission lookups. `{ lite: true }` is enough here: we only need
    // object metadata to resolve the repository, not permissions/role maps (and
    // using the full context here would recursively re-request this very cache key).
    const appAccessRecords =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const appAccessRepository =
            await this.globalWorkspaceOrmManager.getRepository(
              workspaceId,
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
      const grantedPermissions = (grantsByAppId[appId] ??= new Set());

      for (const permission of permissions ?? []) {
        const operation =
          APP_SCOPE_OPERATION_BY_PERMISSION_OPTION_VALUE[permission];

        if (isDefined(operation)) {
          grantedPermissions.add(operation);
        }
      }
    }

    return grantsByMemberId;
  }

  private async computeAllObjectRecordsRoleFlagsByRoleId(
    workspaceId: string,
  ): Promise<AllObjectRecordsRoleFlagsByRoleId> {
    const roles = await this.roleRepository.find(workspaceId);

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
