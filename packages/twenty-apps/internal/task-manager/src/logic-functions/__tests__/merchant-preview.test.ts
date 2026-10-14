import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type CallerScope } from '../../types/caller-scope';

const runtime = vi.hoisted(() => ({
  scope: {
    workspaceMemberId: 'me',
    canBypassAppScope: false,
    canManageViews: false,
    grantsByAppId: { app: ['read'] },
  } as CallerScope,
  query: vi.fn(),
  assertInScope: vi.fn(),
  visibleProjects: vi.fn(),
}));
vi.mock('twenty-sdk/define', () => ({
  defineLogicFunction: (config: unknown) => config,
}));
vi.mock('../utils/run-scoped-route.util', () => ({
  runScopedRoute: async (
    run: (context: {
      client: { query: typeof runtime.query };
      scope: CallerScope;
    }) => Promise<Record<string, unknown>>,
  ) => {
    try {
      return {
        success: true,
        ...(await run({
          client: { query: runtime.query },
          scope: runtime.scope,
        })),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
}));
vi.mock('../app-scope/assert-record-in-scope.util', () => ({
  assertRecordInScope: runtime.assertInScope,
}));
vi.mock('../app-scope/list-visible-project-ids.util', () => ({
  listVisibleProjectIds: runtime.visibleProjects,
}));

import merchantPreview from '../merchant-preview';

type QueryRequest = Record<
  string,
  { __args: { filter: Record<string, unknown> }; edges: { node: unknown } }
>;

const connection = (nodes: unknown[]) => ({
  edges: nodes.map((node, index) => ({ cursor: String(index), node })),
});

const callRoute = (merchantId: string) =>
  (
    merchantPreview as unknown as {
      handler: (event: { body: { merchantId: string } }) => Promise<
        Record<string, unknown>
      >;
    }
  ).handler({ body: { merchantId } });

beforeEach(() => {
  vi.clearAllMocks();
  runtime.assertInScope.mockResolvedValue(undefined);
  runtime.visibleProjects.mockResolvedValue(['project-1']);
  runtime.query.mockImplementation(async (request: QueryRequest) => {
    if ('issueMerchants' in request)
      return {
        issueMerchants: connection([
          { id: 'link-1', issueId: 'issue-1' },
          { id: 'link-2', issueId: 'issue-2' },
        ]),
      };
    if ('issues' in request)
      return {
        issues: connection([
          {
            id: 'issue-1',
            issueKey: 'DEMO-1',
            title: 'Checkout bug',
            statusId: 'status-1',
          },
        ]),
      };
    if ('issueStatuses' in request)
      return {
        issueStatuses: connection([
          { id: 'status-1', name: 'Todo', color: 'blue' },
        ]),
      };
    throw new Error(`Unexpected query ${Object.keys(request).join()}`);
  });
});

const findRequest = (pluralName: string) =>
  (runtime.query.mock.calls as [QueryRequest][])
    .map(([request]) => request)
    .find((request) => pluralName in request)?.[pluralName];

describe('merchant-preview route', () => {
  it('returns the linked issues visible to the caller', async () => {
    const result = await callRoute('merchant-1');

    expect(result).toEqual({
      success: true,
      issues: [
        {
          id: 'issue-1',
          issueKey: 'DEMO-1',
          title: 'Checkout bug',
          statusName: 'Todo',
          statusColor: 'blue',
        },
      ],
    });
    expect(findRequest('issues')?.__args.filter).toMatchObject({
      id: { in: ['issue-1', 'issue-2'] },
    });
  });

  it('refuses a merchant outside the caller scope', async () => {
    runtime.assertInScope.mockRejectedValue(new Error('Permission denied'));

    const result = await callRoute('merchant-1');

    expect(result).toEqual({ success: false, error: 'Permission denied' });
    expect(runtime.query).not.toHaveBeenCalled();
  });
});
