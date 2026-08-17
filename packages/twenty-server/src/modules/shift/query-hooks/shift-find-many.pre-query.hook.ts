import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type FindManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

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

// Shift is workspace-global, not app-connected, so app-scope SELECT filtering
// never narrows a read to the caller. Task 9 enforced per-row ownership on WRITES
// only; without this hook a non-elevated member could findMany({ memberId: { eq:
// <someone-else> } }) and read a colleague's shifts (IDOR — security.md §6). Force
// `memberId = self` into every non-elevated read; a Leader/PO (elevated) reads all.
//
// Elevation uses operation: 'write' on purpose — the SAME discriminator the write
// hooks use (canUpdateAllObjectRecords via shouldBypassAppScope). operation: 'read'
// would be wrong here: the seeded member role carries canReadAllObjectRecords=true,
// so it would flag every member as elevated and defeat the scoping.
@Injectable()
@WorkspaceQueryHook(`shift.findMany`)
export class ShiftFindManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: FindManyResolverArgs,
  ): Promise<FindManyResolverArgs> {
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
        // key) owns no shift — deny rather than leak the whole table.
        if (!isUserAuthContext(authContext)) {
          throw new PermissionsException(
            PermissionsExceptionMessage.PERMISSION_DENIED,
            PermissionsExceptionCode.PERMISSION_DENIED,
          );
        }

        const selfMemberFilter: ObjectRecordFilter = {
          memberId: { eq: authContext.workspaceMemberId },
        };

        // AND the caller's own filter with memberId = self. A conflicting
        // memberId filter for someone else becomes (other AND self) => empty.
        // Mutate in place and return the same reference: executePreQueryHooks
        // deep-merges the returned payload into itself, so an in-place rewrite is
        // idempotent and avoids leaving a stray top-level memberId behind.
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
