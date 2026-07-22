import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { isDefined } from 'twenty-shared/utils';

export type ProjectEpic = {
  __typename: string;
  id: string;
  name: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  issues: Array<{ id: string; status: string }>;
};

export const useProjectEpics = (projectId: string | undefined) => {
  const { records, loading, refetch } = useFindManyRecords<ProjectEpic>({
    objectNameSingular: 'epic',
    filter: { projectId: { eq: projectId ?? '' } },
    recordGqlFields: {
      id: true,
      name: true,
      status: true,
      issues: { id: true, status: true },
    },
    skip: !isDefined(projectId),
  });

  return { epics: records, loading, refetch };
};
