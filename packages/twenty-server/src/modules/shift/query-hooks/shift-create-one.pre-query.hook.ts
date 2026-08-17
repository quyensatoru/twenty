import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { assertIsDefinedOrThrow } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { ShiftRateWorkspaceService } from 'src/modules/shift/query-hooks/shift-rate.workspace-service';
import { validateAndStampShiftCreate } from 'src/modules/shift/query-hooks/validate-and-stamp-shift-create.util';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';

// Registration integrity gate for a single create: upsert is the ownership-overwrite
// vector (it would route a colliding id to an UPDATE) and is rejected up front. A
// client-supplied id is allowed through — Twenty generates record ids client-side,
// and without upsert a duplicate id just collides on the primary key at INSERT and
// cannot overwrite a victim's row. The shared helper then runs the per-record
// validation + server stamping (snapshot, name, OT multiplier, nulled attendance,
// member ownership/elevation).
@Injectable()
@WorkspaceQueryHook(`shift.createOne`)
export class ShiftCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly shiftRateWorkspaceService: ShiftRateWorkspaceService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<ShiftWorkspaceEntity>,
  ): Promise<CreateOneResolverArgs<ShiftWorkspaceEntity>> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    // Upsert would let a client id match an existing row and route the create
    // to an UPDATE, overwriting a victim's shift — not supported for shifts.
    if (payload.upsert) {
      throw new CommonQueryRunnerException(
        'Upsert is not supported for shifts',
        CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
        {
          userFriendlyMessage: msg`Upsert is not supported for shifts.`,
        },
      );
    }

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const data = await validateAndStampShiftCreate({
          authContext,
          workspaceId: workspace.id,
          data: payload.data,
          globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
          shiftRateWorkspaceService: this.shiftRateWorkspaceService,
        });

        return {
          ...payload,
          data,
        };
      },
      authContext,
    );
  }
}
