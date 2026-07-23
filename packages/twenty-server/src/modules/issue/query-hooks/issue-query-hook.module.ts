import { Module } from '@nestjs/common';

import { IssueCreateManyPreQueryHook } from 'src/modules/issue/query-hooks/issue-create-many.pre-query.hook';
import { IssueCreateOnePreQueryHook } from 'src/modules/issue/query-hooks/issue-create-one.pre-query.hook';
import { IssueUpdateOnePreQueryHook } from 'src/modules/issue/query-hooks/issue-update-one.pre-query.hook';

@Module({
  providers: [
    IssueCreateOnePreQueryHook,
    IssueCreateManyPreQueryHook,
    IssueUpdateOnePreQueryHook,
  ],
})
export class IssueQueryHookModule {}
