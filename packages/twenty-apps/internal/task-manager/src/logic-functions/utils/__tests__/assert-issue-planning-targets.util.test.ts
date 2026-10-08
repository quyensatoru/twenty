import { describe, expect, it, vi } from 'vitest';

import { assertIssuePlanningTargets } from '../assert-issue-planning-targets.util';

// Answers fetchRecordColumn with the target's project, per collection.
const buildClient = (projectIdByPluralName: Record<string, string | null>) => ({
  query: vi.fn(async (request: Record<string, unknown>) => {
    const pluralName = Object.keys(request)[0] as string;
    const projectId = projectIdByPluralName[pluralName];

    return {
      [pluralName]: {
        edges:
          projectId === undefined ? [] : [{ node: { id: 'target', projectId } }],
      },
    };
  }),
});

describe('assertIssuePlanningTargets', () => {
  it('reads nothing when neither a sprint nor an epic is set', async () => {
    const client = buildClient({});

    await assertIssuePlanningTargets({
      client,
      projectId: 'p1',
      sprintId: null,
      epicId: undefined,
    });

    expect(client.query).not.toHaveBeenCalled();
  });

  it('accepts a sprint and an epic of the same project', async () => {
    await expect(
      assertIssuePlanningTargets({
        client: buildClient({ sprints: 'p1', epics: 'p1' }),
        projectId: 'p1',
        sprintId: 's1',
        epicId: 'e1',
      }),
    ).resolves.toBeUndefined();
  });

  it("refuses another project's sprint", async () => {
    await expect(
      assertIssuePlanningTargets({
        client: buildClient({ sprints: 'p2' }),
        projectId: 'p1',
        sprintId: 's1',
        epicId: undefined,
      }),
    ).rejects.toThrow('This sprint belongs to another project.');
  });

  it('refuses an epic that cannot be read', async () => {
    await expect(
      assertIssuePlanningTargets({
        client: buildClient({}),
        projectId: 'p1',
        sprintId: undefined,
        epicId: 'e1',
      }),
    ).rejects.toThrow('This epic belongs to another project.');
  });

  it('refuses a sprint on an issue with no project', async () => {
    await expect(
      assertIssuePlanningTargets({
        client: buildClient({ sprints: 'p1' }),
        projectId: null,
        sprintId: 's1',
        epicId: undefined,
      }),
    ).rejects.toThrow('This sprint belongs to another project.');
  });
});
