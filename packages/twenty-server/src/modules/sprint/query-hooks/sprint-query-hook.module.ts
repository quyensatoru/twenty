import { Module } from '@nestjs/common';

import { SprintCreateOnePreQueryHook } from 'src/modules/sprint/query-hooks/sprint-create-one.pre-query.hook';
import { SprintUpdateOnePreQueryHook } from 'src/modules/sprint/query-hooks/sprint-update-one.pre-query.hook';

@Module({
  providers: [SprintCreateOnePreQueryHook, SprintUpdateOnePreQueryHook],
})
export class SprintQueryHookModule {}
