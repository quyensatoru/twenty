import { Module } from '@nestjs/common';

import { EpicCreateOnePreQueryHook } from 'src/modules/epic/query-hooks/epic-create-one.pre-query.hook';
import { EpicUpdateOnePreQueryHook } from 'src/modules/epic/query-hooks/epic-update-one.pre-query.hook';

@Module({
  providers: [EpicCreateOnePreQueryHook, EpicUpdateOnePreQueryHook],
})
export class EpicQueryHookModule {}
