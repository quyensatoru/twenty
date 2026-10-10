import { beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({
  query: vi.fn(),
  mutation: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  getConnection: vi.fn(),
}));
vi.mock('twenty-client-sdk/core', () => ({
  CoreApiClient: class {
    query = runtime.query;
    mutation = runtime.mutation;
  },
}));
vi.mock('twenty-sdk/define', () => ({
  defineLogicFunction: (config: unknown) => config,
}));
vi.mock('twenty-sdk/logic-function', () => ({
  kv: { get: runtime.get, set: runtime.set },
  getConnection: runtime.getConnection,
  Response: class {},
  reportConnectionAuthFailure: vi.fn(),
}));

import { gitWebhookResolverHandler } from '../git-webhook-resolver';
import { upsertDevelopmentReferences } from '../utils/upsert-development-links.util';
import { getGitHubUser } from '../utils/github-api.util';

const ROUTE_CONTEXT = {
  pathParameters: {},
  isBase64Encoded: false,
  requestContext: { http: { method: 'POST', path: '/webhook' } },
  userWorkspaceId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('git integration', () => {
  it('routes a claimed installation without reading owner-workspace registration', async () => {
    runtime.get.mockImplementation(
      async (_key: string, options?: { scope: string }) =>
        options?.scope === 'SERVER' ? 'installed-workspace' : null,
    );
    const result = await gitWebhookResolverHandler({
      ...ROUTE_CONTEXT,
      queryStringParameters: { connection: 'account-1', repository: 'repo-1' },
      headers: {},
      body: {},
    });
    expect(result).toMatchObject({ workspaceId: 'installed-workspace' });
  });

  it('keeps equal PR numbers in different repositories separate', async () => {
    const records: Record<string, unknown>[] = [
      {
        id: 'repo-one-pr',
        issueId: 'issue-1',
        repositoryId: 'repo-1',
        linkType: 'PULL_REQUEST',
        externalId: '12',
        title: 'PROJ-1 frontend',
      },
    ];
    const query = vi.fn(
      async (
        selection: Record<
          string,
          { __args: { filter: Record<string, { eq: string }> } }
        >,
      ) => {
        if (selection.issues)
          return {
            issues: { edges: [{ node: { id: 'issue-1', appId: 'app-1' } }] },
          };
        if (selection.projects)
          return { projects: { edges: [{ node: { appId: 'app-1' } }] } };
        const filter = selection.developmentLinks.__args.filter;
        return {
          developmentLinks: {
            edges: records
              .filter((record) =>
                Object.entries(filter).every(
                  ([key, condition]) => record[key] === condition.eq,
                ),
              )
              .map((node) => ({ node })),
          },
        };
      },
    );
    const mutation = vi.fn(
      async (
        selection: Record<
          string,
          { __args: { id?: string; data: Record<string, unknown> } }
        >,
      ) => {
        if (selection.createDevelopmentLink) {
          records.push({
            id: 'repo-two-pr',
            ...selection.createDevelopmentLink.__args.data,
          });
          return { createDevelopmentLink: { id: 'repo-two-pr' } };
        }
        const { id, data } = selection.updateDevelopmentLink.__args;
        Object.assign(records.find((record) => record.id === id)!, data);
        return { updateDevelopmentLink: { id } };
      },
    );
    await upsertDevelopmentReferences({
      client: { query, mutation },
      repositoryId: 'repo-2',
      defaultRepositorySlug: 'backend',
      references: [
        { kind: 'pull-request', externalId: '12', title: 'PROJ-1 backend' },
      ],
    });
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      repositoryId: 'repo-1',
      title: 'PROJ-1 frontend',
    });
  });

  it('uses the configured Enterprise API instead of sending its token to github.com', async () => {
    vi.stubEnv('GITHUB_BASE_URL', 'https://github.internal');
    const requestedUrls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      requestedUrls.push(url);
      return new globalThis.Response(JSON.stringify({ login: 'quyen', id: 1 }));
    });
    await getGitHubUser({
      accessToken: 'enterprise-token',
      connectionId: 'account-1',
    });
    expect(requestedUrls).toEqual(['https://github.internal/api/v3/user']);
  });
});

describe('concurrent deliveries', () => {
  it('retries an insert conflict against the same stable primary key', async () => {
    let inserted: Record<string, unknown> | null = null;
    let initialReads = 0;
    const query = async (selection: Record<string, unknown>) => {
      if (selection.issues)
        return {
          issues: {
            edges: [{ node: { id: 'issue-1', projectId: 'project-1' } }],
          },
        };
      if (selection.projects)
        return { projects: { edges: [{ node: { appId: 'app-1' } }] } };
      initialReads++;
      return {
        developmentLinks: {
          edges:
            initialReads <= 2 || inserted === null ? [] : [{ node: inserted }],
        },
      };
    };
    const mutation = async (
      selection: Record<string, { __args: { data: Record<string, unknown> } }>,
    ) => {
      if (selection.createDevelopmentLink) {
        const data = selection.createDevelopmentLink.__args.data;
        if (inserted !== null) throw new Error('duplicate key');
        inserted = data;
        return { createDevelopmentLink: data };
      }
      return { updateDevelopmentLink: inserted };
    };
    const input = {
      client: { query, mutation },
      repositoryId: 'repo-1',
      defaultRepositorySlug: 'repo',
      references: [{ kind: 'commit', externalId: 'abc', title: 'PROJ-1 fix' }],
    };
    const results = await Promise.allSettled([
      upsertDevelopmentReferences(input),
      upsertDevelopmentReferences(input),
    ]);
    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
    expect(inserted).toMatchObject({
      id: expect.stringMatching(/^[\da-f-]{36}$/),
    });
  });
});

import { createHmac } from 'node:crypto';
import { gitWebhookHandler } from '../git-webhook';
import { gitBackfillHandler } from '../git-backfill';

describe('paused repositories', () => {
  it('rejects a queued signed delivery after the repository is paused', async () => {
    runtime.get.mockResolvedValue({
      provider: 'github',
      connectionId: 'account-1',
      secret: 'secret',
      isActive: true,
    });
    runtime.query.mockResolvedValue({
      repositories: { edges: [{ node: { id: 'repo-1', isActive: false } }] },
    });
    const body = {
      repository: { id: 1 },
      commits: [{ message: 'PROJ-1 change', id: 'abc' }],
    };
    const rawBody = JSON.stringify(body);
    const result = await gitWebhookHandler({
      ...ROUTE_CONTEXT,
      body,
      rawBody,
      queryStringParameters: { repository: 'repo-1', connection: 'account-1' },
      headers: {
        'x-github-event': 'push',
        'x-hub-signature-256': `sha256=${createHmac('sha256', 'secret').update(rawBody).digest('hex')}`,
      },
    });
    expect(result).toMatchObject({ success: true, skipped: true });
    expect(runtime.mutation).not.toHaveBeenCalled();
  });
  it('skips a backfill queued before pause', async () => {
    runtime.query.mockResolvedValue({
      repositories: { edges: [{ node: { id: 'repo-1', isActive: false } }] },
    });
    await expect(
      gitBackfillHandler({ repositoryId: 'repo-1' }),
    ).resolves.toMatchObject({ skipped: true });
  });
});

import { repairGitWebhook } from '../utils/repair-git-webhook.util';
describe('webhook repair', () => {
  it('updates an existing GitHub hook to receive branch, CI and deployment events', async () => {
    runtime.get.mockResolvedValue({
      provider: 'github',
      connectionId: 'account-1',
      hookId: '77',
      secret: 'existing-secret',
      isActive: true,
    });
    vi.stubEnv('TWENTY_API_URL', 'https://crm.example');
    const requests: { method: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      requests.push({
        method: init.method ?? 'GET',
        body: JSON.parse(String(init.body)) as Record<string, unknown>,
      });
      return new globalThis.Response(JSON.stringify({ id: 77 }));
    });
    await repairGitWebhook({
      repository: {
        id: 'repo-1',
        provider: 'GITHUB',
        isActive: true,
        externalId: '1',
        connectionId: 'account-1',
        slug: 'acme/repo',
        baseUrl: 'https://api.github.com',
        remoteUrl: 'https://github.com/acme/repo',
      },
      accessToken: 'token',
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: 'PATCH',
      body: {
        events: expect.arrayContaining([
          'create',
          'delete',
          'workflow_run',
          'deployment_status',
        ]),
      },
    });
  });
});

describe('delivery webhook integration', () => {
  it('saves a signed deployment to its issue and updates webhook sync health', async () => {
    runtime.get.mockResolvedValue({
      provider: 'github',
      connectionId: 'account-1',
      secret: 'secret',
      isActive: true,
    });
    runtime.getConnection.mockResolvedValue({ accessToken: 'token' });
    runtime.query.mockImplementation(
      async (selection: Record<string, unknown>) => {
        if (selection.repositories)
          return {
            repositories: {
              edges: [
                {
                  node: {
                    id: 'repo-1',
                    isActive: true,
                    provider: 'GITHUB',
                    externalId: '1',
                    slug: 'acme/repo',
                    connectionId: 'account-1',
                    baseUrl: 'https://api.github.com',
                  },
                },
              ],
            },
          };
        if (selection.issues)
          return {
            issues: {
              edges: [{ node: { id: 'issue-1', projectId: 'project-1' } }],
            },
          };
        if (selection.projects)
          return { projects: { edges: [{ node: { appId: 'app-1' } }] } };
        return { developmentDeliveries: { edges: [] } };
      },
    );
    runtime.mutation.mockResolvedValue({
      createDevelopmentDelivery: { id: 'event-1' },
    });
    const body = {
      repository: { id: 1 },
      deployment: {
        id: 8,
        description: 'PROJ-1 deploy',
        environment: 'production',
      },
      deployment_status: {
        id: 11,
        state: 'success',
        updated_at: '2026-10-10T02:00:00Z',
      },
    };
    const rawBody = JSON.stringify(body);
    const result = await gitWebhookHandler({
      ...ROUTE_CONTEXT,
      body,
      rawBody,
      queryStringParameters: { repository: 'repo-1', connection: 'account-1' },
      headers: {
        'x-github-event': 'deployment_status',
        'x-hub-signature-256': `sha256=${createHmac('sha256', 'secret').update(rawBody).digest('hex')}`,
      },
    });
    expect(result).toMatchObject({ success: true, deliveries: 1 });
    expect(runtime.mutation).toHaveBeenCalledWith(
      expect.objectContaining({
        createDevelopmentDelivery: expect.objectContaining({
          __args: expect.objectContaining({
            data: expect.objectContaining({
              issueId: 'issue-1',
              deliveryType: 'DEPLOYMENT',
              status: 'SUCCESSFUL',
            }),
          }),
        }),
      }),
    );
    expect(runtime.set).toHaveBeenCalledWith(
      'git:webhook-health:repo-1',
      expect.objectContaining({
        lastSyncedAt: expect.any(String),
        error: null,
      }),
    );
  });
});

describe('partial provider failures', () => {
  it('still syncs code links when the CI API is unavailable', async () => {
    vi.stubEnv('TWENTY_API_URL', 'https://crm.example');
    runtime.get.mockResolvedValue(null);
    runtime.getConnection.mockResolvedValue({ accessToken: 'token' });
    runtime.query.mockImplementation(async (selection: Record<string, unknown>) => {
      if (selection.repositories) return { repositories: { edges: [{ node: { id: 'repo-1', isActive: true, provider: 'GITHUB', externalId: '1', slug: 'acme/repo', connectionId: 'account-1', baseUrl: 'https://api.github.com', remoteUrl: 'https://github.com/acme/repo' } }] } };
      if (selection.issues) return { issues: { edges: [{ node: { id: 'issue-1', projectId: 'project-1' } }] } };
      if (selection.projects) return { projects: { edges: [{ node: { appId: 'app-1' } }] } };
      return { developmentLinks: { edges: [] } };
    });
    runtime.mutation.mockResolvedValue({ createDevelopmentLink: { id: 'branch-1' } });
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('/actions/runs')) return new Response('CI permission denied', { status: 403 });
      if (url.includes('/hooks')) return new Response(JSON.stringify({ id: 77 }));
      if (url.includes('/branches?') && url.endsWith('page=1')) return new Response(JSON.stringify([{ name: 'PROJ-1-fix' }]));
      return new Response('[]');
    });
    await expect(gitBackfillHandler({ repositoryId: 'repo-1' })).rejects.toThrow('CI permission denied');
    expect(runtime.mutation).toHaveBeenCalledWith(expect.objectContaining({ createDevelopmentLink: expect.objectContaining({ __args: expect.objectContaining({ data: expect.objectContaining({ externalId: 'PROJ-1-fix' }) }) }) }));
  });
});
