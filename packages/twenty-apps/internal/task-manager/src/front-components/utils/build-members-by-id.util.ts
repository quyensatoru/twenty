import { type MemberRow } from '../hooks/use-issue-detail';

// The issue detail only names the members already on the issue's rows, so a
// member who has only read or reacted is labelled from the discussion's own
// member list, every member holding read access to the issue's app.
export const buildMembersById = (
  ...memberLists: (MemberRow[] | null | undefined)[]
): Map<string, MemberRow> => {
  const membersById = new Map<string, MemberRow>();

  for (const members of memberLists) {
    for (const member of members ?? []) {
      if (!membersById.has(member.id)) {
        membersById.set(member.id, member);
      }
    }
  }

  return membersById;
};
