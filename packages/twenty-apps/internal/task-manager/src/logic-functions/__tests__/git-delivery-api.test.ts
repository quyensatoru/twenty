import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('twenty-sdk/logic-function', () => ({
  reportConnectionAuthFailure: vi.fn(),
}));
import {
  enrichDevelopmentDelivery,
  listRecentDevelopmentDeliveries,
} from '../utils/git-delivery-api.util';
import { type DevelopmentDelivery } from '../../types/development-delivery';

const repository = {
  id: 'repo-1',
  isActive: true,
  provider: 'GITHUB',
  connectionId: 'account-1',
  externalId: '1',
  slug: 'acme/repo',
  baseUrl: 'https://github.internal/api/v3',
  remoteUrl: 'https://github.internal/acme/repo',
};
const delivery: DevelopmentDelivery = {
  deliveryType: 'DEPLOYMENT',
  externalId: '8',
  eventId: '11',
  title: 'Production',
  status: 'SUCCESSFUL',
  commitSha: 'newsha',
  branchName: 'main',
  pipelineId: null,
  environmentName: 'production',
  environmentType: 'PRODUCTION',
  occurredAt: '2026-10-10T02:00:00Z',
  startedAt: '2026-10-10T01:00:00Z',
  url: null,
  text: null,
};
afterEach(() => vi.unstubAllGlobals());
describe('delivery association', () => {
  it('links issue keys in every commit since the previous successful deployment on Enterprise', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      urls.push(url);
      if (url.includes('/deployments?'))
        return new Response(
          JSON.stringify([
            { id: 7, sha: 'oldsha', created_at: '2026-10-09T00:00:00Z' },
          ]),
        );
      if (url.includes('/deployments/7/statuses'))
        return new Response(
          JSON.stringify([
            { state: 'success', created_at: '2026-10-09T01:00:00Z' },
          ]),
        );
      if (url.includes('/compare/oldsha...newsha'))
        return new Response(
          JSON.stringify({
            total_commits: 2,
            commits: [
              { commit: { message: 'PROJ-1 implement feature' } },
              { commit: { message: 'Merge release' } },
            ],
          }),
        );
      throw new Error(`Unexpected API request ${url}`);
    });
    const result = await enrichDevelopmentDelivery({
      repository,
      accessToken: 'token',
      delivery,
    });
    expect(result.text).toContain('PROJ-1');
    expect(
      urls.every((url) => url.startsWith('https://github.internal/api/v3/')),
    ).toBe(true);
  });
  it('does not present a truncated comparison as a complete successful sync', async () => {
    vi.stubGlobal(
      'fetch',
      async (url: string) =>
        new Response(
          JSON.stringify(
            url.includes('/deployments?')
              ? [{ id: 7, sha: 'oldsha', created_at: '2026-10-09T00:00:00Z' }]
              : url.includes('/statuses')
                ? [{ state: 'success', created_at: '2026-10-09T01:00:00Z' }]
                : { total_commits: 2000, commits: [] },
          ),
        ),
    );
    await expect(
      enrichDevelopmentDelivery({ repository, accessToken: 'token', delivery }),
    ).rejects.toThrow(/commit/i);
  });
  it('backfills workflow and deployment status history with provider times', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('/actions/runs'))
        return new Response(
          JSON.stringify({
            workflow_runs: [
              {
                id: 1,
                workflow_id: 2,
                name: 'CI',
                status: 'completed',
                conclusion: 'success',
                head_sha: 'abc',
                updated_at: '2026-10-10T01:00:00Z',
              },
            ],
          }),
        );
      if (url.includes('/deployments?'))
        return new Response(
          JSON.stringify([
            {
              id: 8,
              sha: 'abc',
              environment: 'staging',
              created_at: '2026-10-10T00:00:00Z',
            },
          ]),
        );
      return new Response(
        JSON.stringify([
          { id: 11, state: 'success', updated_at: '2026-10-10T01:00:00Z' },
        ]),
      );
    });
    const results = await listRecentDevelopmentDeliveries({
      repository,
      accessToken: 'token',
    });
    expect(results.map((event) => event.deliveryType)).toEqual([
      'BUILD',
      'DEPLOYMENT',
    ]);
    expect(results.every((event) => event.status === 'SUCCESSFUL')).toBe(true);
  });
});

describe('deployment recovery and baselines', () => {
  it('keeps rollback status and associates the deployed snapshot', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('/deployments?'))
        return Response.json([
          { id: 7, sha: 'oldsha', created_at: '2026-10-09T00:00:00Z' },
        ]);
      if (url.includes('/statuses'))
        return Response.json([
          { state: 'success', created_at: '2026-10-09T01:00:00Z' },
        ]);
      if (url.includes('/compare/'))
        return Response.json({
          status: 'behind',
          total_commits: 0,
          commits: [],
        });
      if (url.includes('/commits?'))
        return Response.json([
          { commit: { message: 'PROJ-2 deployed version' } },
        ]);
      throw new Error(`Unexpected request ${url}`);
    });
    const result = await enrichDevelopmentDelivery({
      repository,
      accessToken: 'token',
      delivery,
    });
    expect(result.status).toBe('SUCCESSFUL');
    expect(result.text).toContain('PROJ-2');
  });
  it('ignores deployments that succeeded after this deployment started', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      urls.push(url);
      if (url.includes('/deployments?'))
        return Response.json([
          { id: 7, sha: 'concurrent', created_at: '2026-10-10T00:00:00Z' },
          { id: 6, sha: 'baseline', created_at: '2026-10-09T00:00:00Z' },
        ]);
      if (url.includes('/7/statuses'))
        return Response.json([
          { state: 'success', created_at: '2026-10-10T01:30:00Z' },
        ]);
      if (url.includes('/6/statuses'))
        return Response.json([
          { state: 'success', created_at: '2026-10-09T01:00:00Z' },
        ]);
      if (url.includes('/compare/'))
        return Response.json({
          total_commits: 1,
          commits: [{ commit: { message: 'PROJ-3 release' } }],
        });
      throw new Error(`Unexpected request ${url}`);
    });
    await enrichDevelopmentDelivery({
      repository,
      accessToken: 'token',
      delivery,
    });
    expect(urls.some((url) => url.includes('/compare/baseline...newsha'))).toBe(
      true,
    );
  });
  it('uses GitLab job completion as the successful baseline cutoff', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      urls.push(url);
      if (url.includes('/deployments/8'))
        return Response.json({
          sha: 'newsha',
          created_at: delivery.startedAt,
          environment: { id: 1, name: 'production' },
        });
      if (url.includes('/environments/1'))
        return Response.json({ tier: 'production' });
      if (url.includes('/deployments?'))
        return Response.json([
          {
            id: 7,
            sha: 'concurrent',
            created_at: '2026-10-10T00:00:00Z',
            deployable: { finished_at: '2026-10-10T01:30:00Z' },
          },
          {
            id: 6,
            sha: 'baseline',
            created_at: '2026-10-09T00:00:00Z',
            deployable: { finished_at: '2026-10-09T01:00:00Z' },
          },
        ]);
      if (url.includes('/repository/compare'))
        return Response.json({ commits: [{ message: 'PROJ-3 release' }] });
      throw new Error(`Unexpected request ${url}`);
    });
    await enrichDevelopmentDelivery({
      repository: {
        ...repository,
        provider: 'GITLAB',
        baseUrl: 'https://gitlab.com',
      },
      accessToken: 'token',
      delivery,
    });
    expect(urls.some((url) => url.includes('from=baseline&to=newsha'))).toBe(
      true,
    );
  });
  it('reads the configured GitLab tier for an environment with a custom name', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('/pipelines?')) return Response.json([]);
      if (url.includes('/deployments?'))
        return Response.json([
          {
            id: 8,
            sha: 'abc',
            status: 'success',
            updated_at: delivery.occurredAt,
            environment: { id: 1, name: 'customer-live' },
          },
        ]);
      if (url.includes('/environments/1'))
        return Response.json({
          id: 1,
          name: 'customer-live',
          tier: 'production',
        });
      throw new Error(`Unexpected request ${url}`);
    });
    const result = await listRecentDevelopmentDeliveries({
      repository: {
        ...repository,
        provider: 'GITLAB',
        baseUrl: 'https://gitlab.com',
      },
      accessToken: 'token',
    });
    expect(result[0].environmentType).toBe('PRODUCTION');
  });
});
