import { REPOSITORY_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { listScopedRecords } from './list-scoped-records.util';

export type GitRepository = {
  id: string;
  isActive: boolean | null;
  slug: string | null;
  provider: string | null;
  externalId: string | null;
  connectionId: string | null;
  baseUrl: string | null;
  remoteUrl: string | null;
};

export const getActiveGitRepository = async (
  client: ApiClient,
  repositoryId: string,
): Promise<GitRepository | null> => {
  const rows = await listScopedRecords<GitRepository>({
    client,
    pluralName: 'repositories',
    filter: { id: { eq: repositoryId } },
    selection: REPOSITORY_SELECTION,
    maxRecords: 1,
  });
  const repository = rows[0];
  return repository?.isActive === true ? repository : null;
};
