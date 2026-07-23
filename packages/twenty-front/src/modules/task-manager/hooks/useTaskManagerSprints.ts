import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

export const useTaskManagerSprints = ({
  projectId,
}: {
  projectId?: string;
}) => {
  const {
    records: sprints,
    loading,
    refetch,
  } = useFindManyRecords({
    objectNameSingular: 'sprint',
    filter: projectId ? { projectId: { eq: projectId } } : undefined,
    recordGqlFields: {
      id: true,
      name: true,
      state: true,
      goal: true,
      projectId: true,
    },
    orderBy: [{ position: 'AscNullsLast' }],
    limit: 100,
  });

  return { sprints, loading, refetch };
};
