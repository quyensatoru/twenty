import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';

export type ProjectMemberRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

type ProjectMemberRoleRecord = {
  __typename: string;
  id: string;
  projectRole: ProjectMemberRole;
};

export const useCurrentProjectRole = (
  projectId: string | undefined,
): ProjectMemberRole | null => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const { records } = useFindManyRecords<ProjectMemberRoleRecord>({
    objectNameSingular: 'projectMember',
    filter: {
      workspaceMemberId: { eq: currentWorkspaceMember?.id ?? '' },
      projectId: { eq: projectId ?? '' },
    },
    recordGqlFields: { id: true, projectRole: true },
    skip: !isDefined(currentWorkspaceMember?.id) || !isDefined(projectId),
  });

  return records[0]?.projectRole ?? null;
};
