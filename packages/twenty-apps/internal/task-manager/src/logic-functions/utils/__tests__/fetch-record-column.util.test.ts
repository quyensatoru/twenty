import { describe, expect, it, vi } from 'vitest';

import {
  enableRecordColumnCache,
  fetchRecordColumn,
} from '../fetch-record-column.util';

const createClient = () => ({
  query: vi.fn().mockResolvedValue({
    issues: { edges: [{ node: { id: 'issue', projectId: 'project' } }] },
  }),
  mutation: vi.fn().mockResolvedValue({}),
});

describe('fetchRecordColumn', () => {
  it('queries every time when the cache is not enabled', async () => {
    const client = createClient();

    await fetchRecordColumn(client, 'issues', 'issue', 'projectId');
    await fetchRecordColumn(client, 'issues', 'issue', 'projectId');

    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('shares a read within one route until the next mutation', async () => {
    const client = createClient();
    enableRecordColumnCache(client);

    const [first, second] = await Promise.all([
      fetchRecordColumn(client, 'issues', 'issue', 'projectId'),
      fetchRecordColumn(client, 'issues', 'issue', 'projectId'),
    ]);

    expect(first).toBe('project');
    expect(second).toBe('project');
    expect(client.query).toHaveBeenCalledTimes(1);

    await client.mutation({ updateIssue: { id: true } });
    await fetchRecordColumn(client, 'issues', 'issue', 'projectId');

    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('does not keep a failed read', async () => {
    const client = createClient();
    client.query.mockRejectedValueOnce(new Error('boom'));
    enableRecordColumnCache(client);

    await expect(
      fetchRecordColumn(client, 'issues', 'issue', 'projectId'),
    ).rejects.toThrow('boom');
    await expect(
      fetchRecordColumn(client, 'issues', 'issue', 'projectId'),
    ).resolves.toBe('project');
  });
});
