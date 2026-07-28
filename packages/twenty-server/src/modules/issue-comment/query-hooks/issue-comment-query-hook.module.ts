import { Module } from '@nestjs/common';

import { IssueCommentCreateOnePreQueryHook } from 'src/modules/issue-comment/query-hooks/issue-comment-create-one.pre-query.hook';
import { IssueCommentDeleteOnePreQueryHook } from 'src/modules/issue-comment/query-hooks/issue-comment-delete-one.pre-query.hook';
import { IssueCommentUpdateOnePreQueryHook } from 'src/modules/issue-comment/query-hooks/issue-comment-update-one.pre-query.hook';

@Module({
  providers: [
    IssueCommentCreateOnePreQueryHook,
    IssueCommentUpdateOnePreQueryHook,
    IssueCommentDeleteOnePreQueryHook,
  ],
})
export class IssueCommentQueryHookModule {}
