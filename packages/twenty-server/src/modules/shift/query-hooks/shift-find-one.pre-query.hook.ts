import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type FindOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { type ObjectRecordFilter } from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { isElevatedActor } from 'src/modules/shift/utils/assert-shift-owner-or-elevated-or-throw.util';

// Single-record reads are exposed to the same IDOR as findMany: a non-elevated
// member fetching another member's shift by id (filter { id: { eq: <x> } }) would
// otherwise read it, since shift carries no app-scope. AND `memberId = self` into
// the filter so the SELECT only matches when the caller owns the row — a foreign
// id then matches nothing and the runner raises RECORD_NOT_FOUND. Leader/PO
// (elevated) read any shift. See ShiftFindManyPreQueryHook for why elevation uses
// operation: 'write' rather than 'read'.
@Injectable()
@WorkspaceQueryHook(`shift.findOne`)
export class ShiftFindOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: FindOneResolverArgs,
  ): Promise<FindOneResolverArgs> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    // isElevatedActor reads the AsyncLocalStorage workspace context — it must
    // run inside executeInWorkspaceContext.
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        if (isElevatedActor({ authContext, operation: 'write' })) {
          return payload;
        }

        // A non-elevated actor with no workspace member (e.g. a non-elevated API
        // key) owns no shift — deny rather than leak a foreign row.
        if (!isUserAuthContext(authContext)) {
          throw new PermissionsException(
            PermissionsExceptionMessage.PERMISSION_DENIED,
            PermissionsExceptionCode.PERMISSION_DENIED,
          );
        }

        const selfMemberFilter: ObjectRecordFilter = {
          memberId: { eq: authContext.workspaceMemberId },
        };

        // AND the id lookup with memberId = self so a foreign record can never
        // resolve. Mutate in place (see ShiftFindManyPreQueryHook for why the
        // in-place rewrite is safe under the hook payload deep-merge).
        const existingFilter = payload.filter;

        payload.filter =
          existingFilter && Object.keys(existingFilter).length > 0
            ? { and: [existingFilter, selfMemberFilter] }
            : selfMemberFilter;

        return payload;
      },
      authContext,
    );
  }
}
