import { describe, expect, it, vi } from 'vitest';

import { writeWithReservedIssueKey } from '../write-with-reserved-issue-key.util';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

// A project counter with the same non-atomic read-then-write the app sees, and
// a key store that rejects duplicates like the unique index on issue.issueKey.
const buildProject = (projectKey: string | null = 'MIDA_F') => {
  let nextIssueNumber = 0;
  const storedKeys = new Set<string>();

  const client = {
    query: vi.fn(async () => {
      const counter = nextIssueNumber;

      await tick();

      return {
        projects: {
          edges: [
            {
              node: {
                id: 'project-1',
                key: projectKey,
                nextIssueNumber: counter,
              },
            },
          ],
        },
      };
    }),
    mutation: vi.fn(async (selection: Record<string, any>) => {
      nextIssueNumber = selection.updateProject.__args.data.nextIssueNumber;
      await tick();

      return { updateProject: { id: 'project-1' } };
    }),
  };

  const storeKey = async (issueKey: string | null) => {
    await tick();

    if (issueKey !== null && storedKeys.has(issueKey)) {
      throw new Error('duplicate key value violates unique constraint');
    }

    if (issueKey !== null) {
      storedKeys.add(issueKey);
    }

    return issueKey;
  };

  return { client, storeKey, storedKeys };
};

describe('writeWithReservedIssueKey', () => {
  it('gives every row of a bulk create its own key', async () => {
    const { client, storeKey } = buildProject();

    const keys = await Promise.all(
      Array.from({ length: 20 }, () =>
        writeWithReservedIssueKey({
          client,
          projectId: 'project-1',
          write: storeKey,
        }),
      ),
    );

    expect(new Set(keys).size).toBe(20);
    expect(keys.every((key) => key?.startsWith('MIDA_F-'))).toBe(true);
  });

  it('writes without a key when the project has none to build from', async () => {
    const { client, storeKey } = buildProject(null);

    await expect(
      writeWithReservedIssueKey({
        client,
        projectId: 'project-1',
        write: storeKey,
      }),
    ).resolves.toBeNull();
  });

  it('does not retry an error unrelated to the key', async () => {
    const { client } = buildProject();
    const write = vi.fn(async () => {
      throw new Error('Forbidden');
    });

    await expect(
      writeWithReservedIssueKey({ client, projectId: 'project-1', write }),
    ).rejects.toThrow('Forbidden');
    expect(write).toHaveBeenCalledTimes(1);
  });
});
