import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

export const useTaskManagerEpics = ({ projectId }: { projectId?: string }) => {
  const {
    records: epics,
    loading,
    refetch,
  } = useFindManyRecords({
    objectNameSingular: 'epic',
    filter: projectId ? { projectId: { eq: projectId } } : undefined,
    recordGqlFields: {
      id: true,
      name: true,
      projectId: true,
    },
    orderBy: [{ position: 'AscNullsLast' }],
    limit: 100,
  });

  return { epics, loading, refetch };
};
