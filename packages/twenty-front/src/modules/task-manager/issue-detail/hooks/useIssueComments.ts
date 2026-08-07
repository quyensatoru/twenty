import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type IssueCommentRecord = ObjectRecord & {
  createdAt: string;
  bodyV2: { blocknote: string | null; markdown: string | null } | null;
  author: {
    name?: { firstName?: string; lastName?: string };
    avatarUrl?: string | null;
  } | null;
  authorId: string | null;
  parentCommentId: string | null;
};

export type IssueCommentThreadItem = IssueCommentRecord & {
  replies: IssueCommentRecord[];
};

const groupCommentsIntoThreads = (
  comments: IssueCommentRecord[],
): IssueCommentThreadItem[] => {
  const repliesByParentId = new Map<string, IssueCommentRecord[]>();

  for (const comment of comments) {
    if (!comment.parentCommentId) {
      continue;
    }

    const existingReplies = repliesByParentId.get(comment.parentCommentId);

    if (existingReplies) {
      existingReplies.push(comment);
    } else {
      repliesByParentId.set(comment.parentCommentId, [comment]);
    }
  }

  return comments
    .filter((comment) => !comment.parentCommentId)
    .map((comment) => ({
      ...comment,
      replies: repliesByParentId.get(comment.id) ?? [],
    }));
};

export const useIssueComments = (issueId: string) => {
  const {
    records: comments,
    loading,
    refetch,
  } = useFindManyRecords<IssueCommentRecord>({
    objectNameSingular: 'issueComment',
    filter: { issueId: { eq: issueId } },
    orderBy: [{ createdAt: 'AscNullsLast' }],
    recordGqlFields: {
      id: true,
      createdAt: true,
      bodyV2: true,
      author: { id: true, name: true, avatarUrl: true },
      authorId: true,
      parentCommentId: true,
    },
    limit: 250,
  });

  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'issueComment',
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: 'issueComment',
  });

  const postComment = async (
    blocknote: string,
    authorId: string | undefined,
    parentCommentId?: string,
  ) => {
    await createOneRecord({
      issueId,
      authorId,
      parentCommentId: parentCommentId ?? null,
      bodyV2: { blocknote, markdown: null },
    });
    await refetch();
  };

  const postReply = (
    parentCommentId: string,
    blocknote: string,
    authorId: string | undefined,
  ) => postComment(blocknote, authorId, parentCommentId);

  const updateComment = async (commentId: string, blocknote: string) => {
    await updateOneRecord({
      objectNameSingular: 'issueComment',
      idToUpdate: commentId,
      updateOneRecordInput: { bodyV2: { blocknote, markdown: null } },
    });
    await refetch();
  };

  const deleteComment = async (commentId: string) => {
    await deleteOneRecord(commentId);
    await refetch();
  };

  return {
    comments: groupCommentsIntoThreads(comments),
    loading,
    postComment,
    postReply,
    updateComment,
    deleteComment,
  };
};
