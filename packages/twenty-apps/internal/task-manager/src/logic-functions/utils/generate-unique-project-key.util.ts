import { type ApiClient } from '../../types/api-client';
import { buildProjectKeyFromName } from '../../utils/build-project-key-from-name.util';
import { type Connection } from '../../types/connection';

const MAX_KEY_CANDIDATES = 50;

// The per-candidate existence check races under concurrent creation, exactly
// as in the fork; the unique constraint on `project.key` is the real safety
// net and a collision surfaces as a retryable error.
export const generateUniqueProjectKey = async ({
  client,
  name,
}: {
  client: ApiClient;
  name: string;
}): Promise<string> => {
  const baseKey = buildProjectKeyFromName(name);

  let candidateKey = baseKey;
  let suffix = 2;

  while (suffix <= MAX_KEY_CANDIDATES + 1) {
    const result = await client.query({
      projects: {
        __args: { filter: { key: { eq: candidateKey } }, first: 1 },
        edges: { node: { id: true } },
      },
    });

    const connection = result?.projects as
      | Connection<{ id: string }>
      | undefined;

    if ((connection?.edges?.length ?? 0) === 0) {
      return candidateKey;
    }

    candidateKey = `${baseKey}${suffix}`;
    suffix += 1;
  }

  return candidateKey;
};
