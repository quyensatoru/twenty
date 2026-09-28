import { SHIFT_MEMBERS_ROUTE_PATH } from '../../constants/route-paths';
import { type ShiftMember } from '../../types/shift-member';
import { postAppRoute } from './post-app-route.util';

// `isElevated` decides whether the Report page shows the member picker at all.
// The route answers with an empty list for an ordinary member rather than an
// error, so a failure here is a real failure.
export const fetchMembers = async (): Promise<{
  members: ShiftMember[];
  isElevated: boolean;
  workspaceMemberId: string | null;
}> => {
  const result = await postAppRoute<{
    success: true;
    members: ShiftMember[];
    isElevated: boolean;
    workspaceMemberId: string | null;
  }>(SHIFT_MEMBERS_ROUTE_PATH);

  return {
    members: result.members ?? [],
    isElevated: result.isElevated === true,
    workspaceMemberId: result.workspaceMemberId ?? null,
  };
};
