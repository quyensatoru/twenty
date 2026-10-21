import { type ApiClient } from '../../types/api-client';
import { buildIssueKey } from '../../utils/build-issue-key.util';
import { isUniqueConstraintError } from '../../utils/is-unique-constraint-error.util';
import { reserveProjectIssueNumbers } from './reserve-project-issue-numbers.util';

const MAX_ISSUE_KEY_ATTEMPTS = 10;
const MAX_RETRY_DELAY_MS = 250;

const waitBeforeRetry = (attempt: number) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.random() * MAX_RETRY_DELAY_MS * attempt),
  );

// Bounded retry around the non-atomic counter bump (see
// reserve-project-issue-numbers.util.ts). A bulk create fires one trigger per
// row at the same instant; the winner has already bumped the counter, so a
// loser re-reads it after a random delay. Without the jitter the losers
// re-collide in lockstep.
// `write` receives null when the project has no key to build from.
export const writeWithReservedIssueKey = async <TResult>({
  client,
  projectId,
  write,
}: {
  client: ApiClient;
  projectId: string;
  write: (issueKey: string | null) => Promise<TResult>;
}): Promise<TResult> => {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ISSUE_KEY_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await waitBeforeRetry(attempt);
    }

    const reservation = await reserveProjectIssueNumbers({
      client,
      projectId,
      count: 1,
    });

    if (reservation === null) {
      return write(null);
    }

    try {
      return await write(
        buildIssueKey(reservation.key, reservation.firstIssueNumber),
      );
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
