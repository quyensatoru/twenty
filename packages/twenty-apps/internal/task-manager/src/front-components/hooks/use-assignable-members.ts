import { useCallback, useEffect, useState } from 'react';

import { LIST_MEMBERS_ROUTE_PATH } from '../../constants/route-paths';
import { postAppRoute } from '../utils/post-app-route.util';
import { type MemberRow } from './use-issue-detail';

// Who may be put on an issue: the members holding a grant on the project's app,
// which is the rule assertRelationTargetAppScope enforces on write. The route
// has always known it; the picker went through the host's FIELDS widget for a
// while, which queries workspaceMember directly and so offered the whole
// workspace — including people the write would then refuse.
export const useAssignableMembers = (projectId: string | null) => {
  const [members, setMembers] = useState<MemberRow[]>([]);

  const load = useCallback(async () => {
    if (projectId === null) {
      setMembers([]);

      return;
    }

    try {
      const result = await postAppRoute<{
        success: true;
        members?: MemberRow[];
      }>(LIST_MEMBERS_ROUTE_PATH, { projectId });

      setMembers(result.members ?? []);
    } catch {
      // A picker with no options is the safe failure: it offers nobody rather
      // than everybody, and the row keeps whoever it already has.
      setMembers([]);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  return members;
};
