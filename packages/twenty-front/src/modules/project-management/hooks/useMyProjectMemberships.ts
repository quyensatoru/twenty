import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';
import { type ProjectMemberRole } from '@/project-management/hooks/useCurrentProjectRole';

export type MyProjectMembership = {
  __typename: string;
  id: string;
  projectRole: ProjectMemberRole;
  project: {
    id: string;
    name: string;
    key: string;
  } | null;
};

export const useMyProjectMemberships = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const { records, loading } = useFindManyRecords<MyProjectMembership>({
    objectNameSingular: 'projectMember',
    filter: {
      workspaceMemberId: { eq: currentWorkspaceMember?.id ?? '' },
    },
    recordGqlFields: {
      id: true,
      projectRole: true,
      project: { id: true, name: true, key: true },
    },
    skip: !isDefined(currentWorkspaceMember?.id),
  });

  return { projectMemberships: records, loading };
};
