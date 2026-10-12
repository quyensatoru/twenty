import { type DiscussionReadState } from '../hooks/use-discussion-state';
import { type IssueCommentRow } from '../hooks/use-issue-detail';

export const hasReadComment = (
  states: DiscussionReadState[],
  memberId: string | null,
  comment: IssueCommentRow,
): boolean =>
  states.some(
    (state) =>
      state.memberId === memberId &&
      (state.commentId != null
        ? state.commentId === comment.id
        : new Date(state.lastReadAt).getTime() >=
          new Date(comment.createdAt ?? '').getTime()),
  );
