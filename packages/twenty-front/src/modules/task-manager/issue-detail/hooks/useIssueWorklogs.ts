import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type IssueWorklogRecord = ObjectRecord & {
  createdAt: string;
  description: string | null;
  timeSpentMinutes: number | null;
  member: {
    name?: { firstName?: string; lastName?: string };
    avatarUrl?: string | null;
    jobTitle?: string | null;
    userEmail?: string | null;
  } | null;
  memberId: string | null;
  createdBy: { name?: string } | null;
};

export const useIssueWorklogs = (issueId: string) => {
  const {
    records: worklogs,
    loading,
    refetch,
  } = useFindManyRecords<IssueWorklogRecord>({
    objectNameSingular: 'worklog',
    filter: { issueId: { eq: issueId } },
    orderBy: [{ createdAt: 'DescNullsLast' }],
    recordGqlFields: {
      id: true,
      createdAt: true,
      description: true,
      timeSpentMinutes: true,
      member: {
        id: true,
        name: true,
        avatarUrl: true,
        jobTitle: true,
        userEmail: true,
      },
      memberId: true,
      createdBy: true,
    },
    limit: 250,
  });

  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'worklog',
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: 'worklog',
  });

  const logWork = async ({
    timeSpentMinutes,
    description,
    memberId,
  }: {
    timeSpentMinutes: number;
    description: string;
    memberId: string | undefined;
  }) => {
    await createOneRecord({
      issueId,
      memberId,
      timeSpentMinutes,
      description: description || null,
    });
    await refetch();
  };

  const updateWorklog = async (
    worklogId: string,
    updates: { timeSpentMinutes: number; description: string },
  ) => {
    await updateOneRecord({
      objectNameSingular: 'worklog',
      idToUpdate: worklogId,
      updateOneRecordInput: {
        timeSpentMinutes: updates.timeSpentMinutes,
        description: updates.description || null,
      },
    });
    await refetch();
  };

  const deleteWorklog = async (worklogId: string) => {
    await deleteOneRecord(worklogId);
    await refetch();
  };

  return {
    worklogs,
    loading,
    logWork,
    updateWorklog,
    deleteWorklog,
  };
};
