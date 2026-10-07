import { type ApiClient } from '../../types/api-client';
import { listScopedRecords } from './list-scoped-records.util';

// The members holding a grant on an app: who an issue of that app can be
// assigned to (the rule the write path enforces), and who a board of it can
// be filtered by.
export const listAppMembers = async ({
  client,
  appId,
}: {
  client: ApiClient;
  appId: string;
}): Promise<unknown[]> => {
  const grants = await listScopedRecords<{ memberId: string }>({
    client,
    pluralName: 'appAccesses',
    filter: { appId: { eq: appId } },
    selection: { id: true, memberId: true },
  });
  const memberIds = [...new Set(grants.map((grant) => grant.memberId))];

  if (memberIds.length === 0) {
    return [];
  }

  return listScopedRecords({
    client,
    pluralName: 'workspaceMembers',
    filter: { id: { in: memberIds } },
    selection: {
      id: true,
      name: { firstName: true, lastName: true },
      userEmail: true,
      avatarUrl: true,
    },
  });
};
