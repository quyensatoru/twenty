import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

export const useIssueComments = (issueId: string) => {
  const {
    records: comments,
    loading,
    refetch,
  } = useFindManyRecords({
    objectNameSingular: 'issueComment',
    filter: { issueId: { eq: issueId } },
    orderBy: [{ createdAt: 'AscNullsLast' }],
    recordGqlFields: {
      id: true,
      createdAt: true,
      bodyV2: true,
      author: true,
    },
    limit: 250,
  });

  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'issueComment',
  });

  const postComment = async (
    blocknote: string,
    authorId: string | undefined,
  ) => {
    await createOneRecord({
      issueId,
      authorId,
      bodyV2: { blocknote, markdown: null },
    });
    await refetch();
  };

  return { comments, loading, postComment };
};
