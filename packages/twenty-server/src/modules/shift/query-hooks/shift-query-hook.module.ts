import { Module } from '@nestjs/common';

import { ShiftCreateManyPreQueryHook } from 'src/modules/shift/query-hooks/shift-create-many.pre-query.hook';
import { ShiftCreateOnePreQueryHook } from 'src/modules/shift/query-hooks/shift-create-one.pre-query.hook';
import { ShiftFindManyPreQueryHook } from 'src/modules/shift/query-hooks/shift-find-many.pre-query.hook';
import { ShiftFindOnePreQueryHook } from 'src/modules/shift/query-hooks/shift-find-one.pre-query.hook';
import { ShiftRateWorkspaceService } from 'src/modules/shift/query-hooks/shift-rate.workspace-service';
import { ShiftRecomputeWorkspaceService } from 'src/modules/shift/query-hooks/shift-recompute.workspace-service';
import { ShiftUpdateManyPreQueryHook } from 'src/modules/shift/query-hooks/shift-update-many.pre-query.hook';
import { ShiftUpdateOnePostQueryHook } from 'src/modules/shift/query-hooks/shift-update-one.post-query.hook';
import { ShiftUpdateOnePreQueryHook } from 'src/modules/shift/query-hooks/shift-update-one.pre-query.hook';

@Module({
  providers: [
    ShiftRateWorkspaceService,
    ShiftRecomputeWorkspaceService,
    ShiftCreateOnePreQueryHook,
    ShiftCreateManyPreQueryHook,
    ShiftFindManyPreQueryHook,
    ShiftFindOnePreQueryHook,
    ShiftUpdateOnePreQueryHook,
    ShiftUpdateManyPreQueryHook,
    ShiftUpdateOnePostQueryHook,
  ],
})
export class ShiftQueryHookModule {}
