type MemberName = {
  firstName?: string | null;
  lastName?: string | null;
} | null;

// "FirstName LastName" from the workspaceMember composite `name`. Both parts
// empty -> null. No other member field is ever read for display.
export const formatMemberName = (name: MemberName): string | null => {
  const firstName = name?.firstName?.trim() ?? '';
  const lastName = name?.lastName?.trim() ?? '';
  const fullName = [firstName, lastName]
    .filter((part) => part.length > 0)
    .join(' ');

  return fullName.length > 0 ? fullName : null;
};
