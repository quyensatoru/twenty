import { Module } from '@nestjs/common';

import { IssueCommentCreateOnePreQueryHook } from 'src/modules/issue-comment/query-hooks/issue-comment-create-one.pre-query.hook';
import { IssueCommentUpdateOnePreQueryHook } from 'src/modules/issue-comment/query-hooks/issue-comment-update-one.pre-query.hook';

@Module({
  providers: [
    IssueCommentCreateOnePreQueryHook,
    IssueCommentUpdateOnePreQueryHook,
  ],
})
export class IssueCommentQueryHookModule {}
