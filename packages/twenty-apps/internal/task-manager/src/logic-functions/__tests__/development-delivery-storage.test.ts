import { describe, expect, it } from 'vitest';
import { saveDevelopmentDeliveries } from '../utils/save-development-deliveries.util';
import { type DevelopmentDelivery } from '../../types/development-delivery';

const delivery: DevelopmentDelivery = {
  deliveryType: 'DEPLOYMENT',
  externalId: '8',
  eventId: '11',
  title: 'Production',
  status: 'SUCCESSFUL',
  commitSha: 'abc',
  branchName: 'main',
  pipelineId: 'pipeline',
  environmentName: 'production',
  environmentType: 'PRODUCTION',
  occurredAt: '2026-10-10T01:00:00Z',
  startedAt: '2026-10-10T00:00:00Z',
  url: 'https://ci/log',
  text: 'PROJ-1 change',
};
describe('delivery storage', () => {
  it('stores one immutable event per issue across concurrent retries', async () => {
    const rows = new Map<string, Record<string, unknown>>();
    const client = {
      query: async (
        selection: Record<
          string,
          { __args: { filter: { id?: { eq: string } } } }
        >,
      ) => {
        if (selection.issues)
          return {
            issues: {
              edges: [{ node: { id: 'issue-1', projectId: 'project-1' } }],
            },
          };
        if (selection.projects)
          return { projects: { edges: [{ node: { appId: 'app-1' } }] } };
        const id = selection.developmentDeliveries.__args.filter.id?.eq;
        return {
          developmentDeliveries: {
            edges:
              id !== undefined && rows.has(id) ? [{ node: rows.get(id) }] : [],
          },
        };
      },
      mutation: async (
        selection: Record<
          string,
          { __args: { data: Record<string, unknown> & { id: string } } }
        >,
      ) => {
        const data = selection.createDevelopmentDelivery.__args.data;
        if (rows.has(data.id)) throw new Error('duplicate key');
        rows.set(data.id, data);
        return { createDevelopmentDelivery: data };
      },
    };
    const options = { client, repositoryId: 'repo-1', deliveries: [delivery] };
    await Promise.all([
      saveDevelopmentDeliveries(options),
      saveDevelopmentDeliveries(options),
    ]);
    expect(rows.size).toBe(1);
    expect([...rows.values()][0]).toMatchObject({
      appId: 'app-1',
      issueId: 'issue-1',
      status: 'SUCCESSFUL',
    });
    await saveDevelopmentDeliveries({
      ...options,
      deliveries: [
        {
          ...delivery,
          eventId: '10',
          status: 'IN_PROGRESS',
          occurredAt: '2026-10-10T00:00:00Z',
        },
      ],
    });
    expect(rows.size).toBe(2);
    expect([...rows.values()].some((row) => row.status === 'SUCCESSFUL')).toBe(
      true,
    );
  });
  it('does not attach a delivery without an issue key to arbitrary issues', async () => {
    let writes = 0;
    await saveDevelopmentDeliveries({
      client: {
        mutation: async () => {
          writes++;
        },
      },
      repositoryId: 'repo-1',
      deliveries: [{ ...delivery, text: null }],
    });
    expect(writes).toBe(0);
  });
});
