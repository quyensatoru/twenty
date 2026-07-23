import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

export const useTaskManagerProjects = () => {
  const { records: projects, loading } = useFindManyRecords({
    objectNameSingular: 'project',
    recordGqlFields: { id: true, name: true, key: true },
    orderBy: [{ name: 'AscNullsLast' }],
    limit: 100,
  });

  return { projects, loading };
};
