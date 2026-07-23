import { Module } from '@nestjs/common';

import { WorklogCreateOnePostQueryHook } from 'src/modules/worklog/query-hooks/worklog-create-one.post-query.hook';
import { WorklogDeleteOnePostQueryHook } from 'src/modules/worklog/query-hooks/worklog-delete-one.post-query.hook';
import { WorklogPostQueryHookService } from 'src/modules/worklog/query-hooks/worklog-post-query-hook.service';
import { WorklogUpdateOnePostQueryHook } from 'src/modules/worklog/query-hooks/worklog-update-one.post-query.hook';

@Module({
  providers: [
    WorklogPostQueryHookService,
    WorklogCreateOnePostQueryHook,
    WorklogUpdateOnePostQueryHook,
    WorklogDeleteOnePostQueryHook,
  ],
})
export class WorklogQueryHookModule {}
