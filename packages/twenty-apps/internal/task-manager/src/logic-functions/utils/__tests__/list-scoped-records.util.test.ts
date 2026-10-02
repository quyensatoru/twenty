import { describe, expect, it, vi } from 'vitest';

import { listScopedRecords } from '../list-scoped-records.util';

// Answers from a fixed row set, honouring `first` and the cursor the helper
// sends back.
const buildClient = (rowCount: number) => ({
  query: vi.fn(async (selection: Record<string, any>) => {
    const [pluralName] = Object.keys(selection);
    const { first, after } = selection[pluralName].__args;
    const offset = after === undefined ? 0 : Number(after) + 1;
    const edges = Array.from(
      { length: Math.max(0, Math.min(first, rowCount - offset)) },
      (_unused, index) => ({
        cursor: String(offset + index),
        node: { id: `record-${offset + index}` },
      }),
    );

    return { [pluralName]: { edges } };
  }),
});

const listIssues = (client: ReturnType<typeof buildClient>, maxRecords?: number) =>
  listScopedRecords<{ id: string }>({
    client,
    pluralName: 'issues',
    filter: { projectId: { in: ['project-1'] } },
    selection: { id: true },
    ...(maxRecords === undefined ? {} : { maxRecords }),
  });

describe('listScopedRecords', () => {
  it('pages until the collection is exhausted', async () => {
    const client = buildClient(450);

    const records = await listIssues(client);

    expect(records).toHaveLength(450);
    expect(client.query).toHaveBeenCalledTimes(3);
  });

  it('returns an empty list when nothing matches', async () => {
    await expect(listIssues(buildClient(0))).resolves.toEqual([]);
  });

  // The silent truncation this replaces left a board short of rows with no
  // symptom: an unbounded read now fails instead of lying.
  it('throws rather than truncating an unbounded read', async () => {
    await expect(listIssues(buildClient(20_001))).rejects.toThrow(
      'Refusing to truncate a issues read',
    );
  });

  it('truncates without throwing when the caller asked for a bounded slice', async () => {
    const records = await listIssues(buildClient(1000), 11);

    expect(records.length).toBeGreaterThanOrEqual(11);
    expect(records.length).toBeLessThan(1000);
  });
});
