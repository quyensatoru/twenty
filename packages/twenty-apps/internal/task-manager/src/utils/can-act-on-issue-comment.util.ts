// Only the comment's author may edit or delete it, unless the caller bypasses
// app-scope entirely (the admin case). Port of the fork's
// assertIssueCommentAuthorOrAppScopeAccessOrThrow.
export const canActOnIssueComment = ({
  commentAuthorId,
  callerWorkspaceMemberId,
  canBypassAppScope,
}: {
  commentAuthorId: string | null | undefined;
  callerWorkspaceMemberId: string | null;
  canBypassAppScope: boolean;
}): boolean => {
  const isAuthor =
    typeof commentAuthorId === 'string' &&
    callerWorkspaceMemberId !== null &&
    commentAuthorId === callerWorkspaceMemberId;

  return isAuthor || canBypassAppScope;
};
