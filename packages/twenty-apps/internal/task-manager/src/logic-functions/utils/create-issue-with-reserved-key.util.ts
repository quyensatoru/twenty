import { type ApiClient } from '../../types/api-client';
import { buildIssueKey, hasIssueKey } from '../../utils/build-issue-key.util';
import { isUniqueConstraintError } from '../../utils/is-unique-constraint-error.util';
import { reserveProjectIssueNumbers } from './reserve-project-issue-numbers.util';

const MAX_ISSUE_KEY_ATTEMPTS = 5;

// Bounded retry around the non-atomic counter bump (see
// reserve-project-issue-numbers.util.ts). Each attempt re-reads the counter
// and offsets past the previous collision, so concurrent creates converge as
// long as fewer than MAX_ISSUE_KEY_ATTEMPTS of them race for the same project.
export const createIssueWithReservedKey = async ({
  client,
  projectId,
  data,
  selection,
}: {
  client: ApiClient;
  projectId: string | null | undefined;
  data: Record<string, unknown>;
  selection: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
  const shouldGenerateKey =
    !hasIssueKey(data.issueKey as string | null | undefined) &&
    typeof projectId === 'string';

  if (!shouldGenerateKey) {
    const result = await client.mutation({
      createIssue: { __args: { data }, ...selection },
    });

    return result?.createIssue;
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ISSUE_KEY_ATTEMPTS; attempt++) {
    const reservation = await reserveProjectIssueNumbers({
      client,
      projectId: projectId as string,
      count: 1,
      attempt,
    });

    if (reservation === null) {
      const result = await client.mutation({
        createIssue: { __args: { data }, ...selection },
      });

      return result?.createIssue;
    }

    try {
      const result = await client.mutation({
        createIssue: {
          __args: {
            data: {
              ...data,
              issueKey: buildIssueKey(
                reservation.key,
                reservation.firstIssueNumber,
              ),
            },
          },
          ...selection,
        },
      });

      return result?.createIssue;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw new Error(
    `Could not allocate a unique issue key after ${MAX_ISSUE_KEY_ATTEMPTS} attempts: ${
      lastError instanceof Error ? lastError.message : 'unknown error'
    }`,
  );
};
