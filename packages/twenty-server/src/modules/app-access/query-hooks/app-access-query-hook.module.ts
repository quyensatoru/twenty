import { Module } from '@nestjs/common';

import { AppAccessCreateOnePostQueryHook } from 'src/modules/app-access/query-hooks/app-access-create-one.post-query.hook';
import { AppAccessDestroyOnePostQueryHook } from 'src/modules/app-access/query-hooks/app-access-destroy-one.post-query.hook';
import { AppAccessUpdateOnePostQueryHook } from 'src/modules/app-access/query-hooks/app-access-update-one.post-query.hook';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [WorkspaceCacheModule],
  providers: [
    AppAccessCreateOnePostQueryHook,
    AppAccessUpdateOnePostQueryHook,
    AppAccessDestroyOnePostQueryHook,
  ],
})
export class AppAccessQueryHookModule {}
