import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { assertIsDefinedOrThrow } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

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

// createMany is a direct overwrite vector too: with upsert + a client id that
// matches a victim's row the batch runner routes to UPDATE. Reject upsert for
// the whole batch, then validate + stamp EACH record through the same shared
// helper the single create uses. Client-supplied ids pass through (Twenty mints
// them client-side); without upsert a duplicate id collides on the primary key
// at INSERT and cannot overwrite an existing row.
@Injectable()
@WorkspaceQueryHook(`shift.createMany`)
export class ShiftCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly shiftRateWorkspaceService: ShiftRateWorkspaceService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateManyResolverArgs<ShiftWorkspaceEntity>,
  ): Promise<CreateManyResolverArgs<ShiftWorkspaceEntity>> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

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
        const data = await Promise.all(
          payload.data.map((record) =>
            validateAndStampShiftCreate({
              authContext,
              workspaceId: workspace.id,
              data: record,
              globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
              shiftRateWorkspaceService: this.shiftRateWorkspaceService,
            }),
          ),
        );

        return {
          ...payload,
          data,
        };
      },
      authContext,
    );
  }
}
