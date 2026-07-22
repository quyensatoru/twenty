import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { isDefined } from 'twenty-shared/utils';

export type ProjectSprint = {
  __typename: string;
  id: string;
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
};

export const useProjectSprints = (projectId: string | undefined) => {
  const { records, loading, refetch } = useFindManyRecords<ProjectSprint>({
    objectNameSingular: 'sprint',
    filter: { projectId: { eq: projectId ?? '' } },
    orderBy: [{ startDate: 'AscNullsLast' }],
    recordGqlFields: {
      id: true,
      name: true,
      goal: true,
      startDate: true,
      endDate: true,
      status: true,
    },
    skip: !isDefined(projectId),
  });

  return { sprints: records, loading, refetch };
};
