import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(
  () =>
    new Map<
      string,
      {
        id: string;
        issueId: string;
        memberId: string;
        ownerToken: string | null;
        leaseUntil: string | null;
      }
    >(),
);
const mutation = vi.hoisted(() => vi.fn());
vi.mock('../../logic-functions/utils/create-app-client.util', () => ({
  createAppClient: () => ({ mutation }),
}));

import { acquireTaskAiRun, releaseTaskAiRun } from '../task-ai-run-lock.util';

type MutationSelection = {
  __args: {
    data: Record<string, unknown>;
    filter?: { and: Record<string, unknown>[] };
  };
};
beforeEach(() => {
  database.clear();
  mutation.mockReset();
  mutation.mockImplementation(
    async (request: Record<string, MutationSelection>) => {
      if (request.createTaskAiRunLock) {
        const data = request.createTaskAiRunLock.__args.data as unknown as {
          id: string;
          issueId: string;
          memberId: string;
          ownerToken: null;
          leaseUntil: null;
        };
        if (database.has(data.id))
          throw new Error('duplicate key violates unique constraint');
        database.set(data.id, { ...data });
        return { createTaskAiRunLock: { id: data.id } };
      }
      const { filter, data } = request.updateTaskAiRunLocks.__args;
      const conditions = filter!.and;
      const equals = (name: string) =>
        (
          conditions.find((condition) => condition[name])?.[name] as
            | { eq: string }
            | undefined
        )?.eq;
      const record = database.get(equals('id')!);
      const expiration = conditions.find((condition) => condition.or)?.or as
        | { leaseUntil: { lte?: string } }[]
        | undefined;
      const eligible =
        record &&
        record.issueId === equals('issueId') &&
        record.memberId === equals('memberId') &&
        (expiration
          ? record.leaseUntil === null ||
            record.leaseUntil <= expiration[1].leaseUntil.lte!
          : record.ownerToken === equals('ownerToken'));
      if (!eligible) return { updateTaskAiRunLocks: [] };
      Object.assign(record, data);
      return { updateTaskAiRunLocks: [{ id: record.id }] };
    },
  );
});

describe('Task AI atomic leases', () => {
  it('admits exactly one simultaneous sender for an issue and member', async () => {
    const results = await Promise.all([
      acquireTaskAiRun('issue', 'member'),
      acquireTaskAiRun('issue', 'member'),
    ]);
    expect(results.filter((result) => result !== null)).toHaveLength(1);
    expect(database.size).toBe(1);
  });

  it('allows another member to acquire independently without releasing the first member', async () => {
    const first = await acquireTaskAiRun('issue', 'member-one');
    expect(await acquireTaskAiRun('issue', 'member-two')).not.toBeNull();
    await releaseTaskAiRun('issue', 'member-two', first!);
    expect(await acquireTaskAiRun('issue', 'member-one')).toBeNull();
  });

  it('reacquires an expired lease and rejects the stale owner release', async () => {
    const first = await acquireTaskAiRun('issue', 'member');
    const record = [...database.values()][0];
    record.leaseUntil = new Date(Date.now() - 1).toISOString();
    const second = await acquireTaskAiRun('issue', 'member');
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
    await releaseTaskAiRun('issue', 'member', first!);
    expect(record.ownerToken).toBe(second);
    await releaseTaskAiRun('issue', 'member', second!);
    expect(await acquireTaskAiRun('issue', 'member')).not.toBeNull();
  });

  it('does not hide non-conflict persistence failures', async () => {
    mutation.mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(acquireTaskAiRun('issue', 'member')).rejects.toThrow(
      'storage unavailable',
    );
  });
});
