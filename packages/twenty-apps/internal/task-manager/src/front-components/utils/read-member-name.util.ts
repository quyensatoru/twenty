type MemberRow = {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
};

export const readMemberName = (
  membersById: Map<string, MemberRow>,
  memberId: string | null | undefined,
  fallback: string,
): string => {
  if (typeof memberId !== 'string') {
    return fallback;
  }

  const member = membersById.get(memberId);
  const fullName = `${member?.name?.firstName ?? ''} ${
    member?.name?.lastName ?? ''
  }`.trim();

  return fullName === '' ? fallback : fullName;
};
