import { Module } from '@nestjs/common';

import { IssueStatusCreateOnePostQueryHook } from 'src/modules/issue-status/query-hooks/issue-status-create-one.post-query.hook';
import { IssueStatusDeleteOnePostQueryHook } from 'src/modules/issue-status/query-hooks/issue-status-delete-one.post-query.hook';
import { ProjectQueryHookModule } from 'src/modules/project/query-hooks/project-query-hook.module';

@Module({
  imports: [ProjectQueryHookModule],
  providers: [IssueStatusCreateOnePostQueryHook, IssueStatusDeleteOnePostQueryHook],
})
export class IssueStatusQueryHookModule {}
