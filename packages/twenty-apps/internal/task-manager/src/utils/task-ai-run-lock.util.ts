import { randomUUID } from 'node:crypto';

import { TASK_AI_RUN_LOCK_OBJECT_UID } from '../constants/task-ai-run-lock';
import { createAppClient } from '../logic-functions/utils/create-app-client.util';
import { getDevelopmentRecordId } from '../logic-functions/utils/upsert-development-links.util';
import { isUniqueConstraintError } from './is-unique-constraint-error.util';

const TASK_AI_RUN_LEASE_MS = 330_000;
const getLockRecordId = (issueId: string, memberId: string) =>
  getDevelopmentRecordId([TASK_AI_RUN_LOCK_OBJECT_UID, issueId, memberId]);

export const acquireTaskAiRun = async (
  issueId: string,
  memberId: string,
): Promise<string | null> => {
  const client = createAppClient();
  const id = getLockRecordId(issueId, memberId);

  // The primary key arbitrates the first simultaneous sends; a read-before-create would race.
  try {
    await client.mutation({
      createTaskAiRunLock: {
        __args: {
          data: { id, issueId, memberId, leaseUntil: null, ownerToken: null },
        },
        id: true,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }

  const ownerToken = randomUUID();
  const now = Date.now();
  // updateMany keeps this predicate in the UPDATE WHERE, so exactly one lease claimant wins.
  const result = (await client.mutation({
    updateTaskAiRunLocks: {
      __args: {
        filter: {
          and: [
            { id: { eq: id } },
            { issueId: { eq: issueId } },
            { memberId: { eq: memberId } },
            {
              or: [
                { leaseUntil: { is: 'NULL' } },
                { leaseUntil: { lte: new Date(now).toISOString() } },
              ],
            },
          ],
        },
        data: {
          ownerToken,
          leaseUntil: new Date(now + TASK_AI_RUN_LEASE_MS).toISOString(),
        },
      },
      id: true,
    },
  })) as { updateTaskAiRunLocks?: { id: string }[] };

  return result.updateTaskAiRunLocks?.some((record) => record.id === id)
    ? ownerToken
    : null;
};

export const releaseTaskAiRun = async (
  issueId: string,
  memberId: string,
  ownerToken: string,
): Promise<void> => {
  await createAppClient().mutation({
    updateTaskAiRunLocks: {
      __args: {
        filter: {
          and: [
            { id: { eq: getLockRecordId(issueId, memberId) } },
            { issueId: { eq: issueId } },
            { memberId: { eq: memberId } },
            { ownerToken: { eq: ownerToken } },
          ],
        },
        data: { ownerToken: null, leaseUntil: null },
      },
      id: true,
    },
  });
};
