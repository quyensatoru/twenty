export type ProjectTimeLog = {
  __typename: string;
  id: string;
  minutesSpent: number;
  loggedDate: string;
  description: string | null;
  issue: { id: string; name: string } | null;
  member: { id: string; name: { firstName: string; lastName: string } } | null;
};
