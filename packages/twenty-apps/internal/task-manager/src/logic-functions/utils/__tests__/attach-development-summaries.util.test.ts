import { describe, expect, it } from 'vitest';
import { attachDevelopmentSummaries } from '../attach-development-summaries.util';

describe('board development summaries', () => {
  it('summarizes only the visible issue ids and does not count deleted branches', async () => {
    const client = {
      query: async (
        selection: Record<
          string,
          { __args: { filter: { issueId: { in: string[] } } } }
        >,
      ) => {
        const [collection, query] = Object.entries(selection)[0];
        expect(query.__args.filter.issueId.in).toEqual(['issue-1']);
        return {
          [collection]: {
            edges:
              collection === 'developmentLinks'
                ? [
                    {
                      node: {
                        issueId: 'issue-1',
                        linkType: 'BRANCH',
                        status: 'DELETED',
                      },
                    },
                    {
                      node: {
                        issueId: 'issue-1',
                        linkType: 'PULL_REQUEST',
                        status: 'OPEN',
                      },
                    },
                  ]
                : [
                    {
                      node: {
                        id: 'event-new',
                        issueId: 'issue-1',
                        repositoryId: 'repo-1',
                        deliveryType: 'DEPLOYMENT',
                        externalId: '8',
                        eventId: '2',
                        status: 'SUCCESSFUL',
                        environmentType: 'PRODUCTION',
                        environmentName: 'production',
                        occurredAt: '2026-10-10T02:00:00Z',
                      },
                    },
                    {
                      node: {
                        id: 'event-old',
                        issueId: 'issue-1',
                        repositoryId: 'repo-1',
                        deliveryType: 'DEPLOYMENT',
                        externalId: '8',
                        eventId: '1',
                        status: 'FAILED',
                        environmentType: 'PRODUCTION',
                        environmentName: 'production',
                        occurredAt: '2026-10-10T01:00:00Z',
                      },
                    },
                  ],
          },
        };
      },
    };
    const issues = await attachDevelopmentSummaries(client, [
      { id: 'issue-1' },
    ]);
    expect(issues[0].developmentSummary).toMatchObject({
      branchCount: 0,
      openPullRequestCount: 1,
      successfulProductionDeploymentCount: 1,
      failedDeploymentCount: 0,
    });
  });
  it('does not query development data for an empty issue page', async () => {
    await expect(attachDevelopmentSummaries({}, [])).resolves.toEqual([]);
  });
});
