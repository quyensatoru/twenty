import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { isDefined } from 'twenty-shared/utils';

export type ProjectIssue = {
  __typename: string;
  id: string;
  name: string;
  issueType: 'STORY' | 'TASK' | 'BUG';
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOWEST' | 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
  storyPoints: number | null;
  assignee: {
    id: string;
    name: { firstName: string; lastName: string };
  } | null;
  sprint: { id: string; status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' } | null;
  epic: { id: string; name: string } | null;
};

// Plain, no filter/sort/field-visibility integration — for internal/derived
// use (counts, pickers). Use useProjectIssuesForView for anything rendered
// to the user with configurable filter/sort/fields (Board, Backlog).
export const useProjectIssues = (projectId: string | undefined) => {
  const { records, loading, refetch } = useFindManyRecords<ProjectIssue>({
    objectNameSingular: 'issue',
    filter: { projectId: { eq: projectId ?? '' } },
    recordGqlFields: {
      id: true,
      name: true,
      issueType: true,
      status: true,
      priority: true,
      storyPoints: true,
      assignee: { id: true, name: { firstName: true, lastName: true } },
      sprint: { id: true, status: true },
      epic: { id: true, name: true },
    },
    skip: !isDefined(projectId),
  });

  return { issues: records, loading, refetch };
};
