import { beforeEach, describe, expect, it, vi } from 'vitest';
const runtime = vi.hoisted(() => ({
  store: new Map<string, unknown>(),
  locked: false,
  memberId: 'member-a' as string | null,
  denied: false,
  runAgent: vi.fn(),
  open: vi.fn(),
  list: vi.fn(),
}));
vi.mock('twenty-sdk/define', () => ({
  defineLogicFunction: (config: unknown) => config,
}));
vi.mock('../utils/run-scoped-route.util', () => ({
  runScopedRoute: async (run: (context: unknown) => Promise<unknown>) => {
    try {
      return {
        success: true,
        ...((await run({
          client: {},
          scope: { workspaceMemberId: runtime.memberId },
        })) as object),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
}));
vi.mock('../app-scope/assert-record-in-scope.util', () => ({
  assertRecordInScope: async () => {
    if (runtime.denied) throw new Error('Denied');
  },
}));
vi.mock('../utils/list-scoped-records.util', () => ({
  listScopedRecords: runtime.list,
}));
vi.mock('../../utils/task-ai-repository.util', () => ({
  openTaskAiRepository: runtime.open,
}));
vi.mock('../../utils/task-ai-agent.util', () => ({
  runTaskAiAgent: runtime.runAgent,
}));
vi.mock('../../utils/task-ai-private-storage.util', () => ({
  taskAiPrivateStorage: {
    get: async (key: string) => runtime.store.get(key) ?? null,
    set: async (key: string, value: unknown) => {
      runtime.store.set(key, value);
    },
    delete: async (key: string) => runtime.store.delete(key),
  },
}));
vi.mock('../app-scope/resolve-caller-scope.util', () => ({
  resolveCallerScope: async () => ({ workspaceMemberId: runtime.memberId }),
}));
vi.mock('../../utils/task-ai-run-lock.util', () => ({
  acquireTaskAiRun: async () => {
    if (runtime.locked) return null;
    runtime.locked = true;
    return 'owner';
  },
  releaseTaskAiRun: async () => {
    runtime.locked = false;
  },
}));
import taskAi from '../task-ai';
const post = (body: Record<string, unknown>) =>
  (
    taskAi as unknown as {
      handler: (event: {
        body: Record<string, unknown>;
      }) => Promise<Record<string, unknown>>;
    }
  ).handler({ body });
const body = {
  action: 'send',
  issueId: 'issue-a',
  message: 'Where should this change go?',
};
beforeEach(() => {
  vi.clearAllMocks();
  runtime.store.clear();
  runtime.locked = false;
  runtime.memberId = 'member-a';
  runtime.denied = false;
  runtime.list.mockImplementation(
    async ({ pluralName }: { pluralName: string }) =>
      pluralName === 'issues'
        ? [{ id: 'issue-a', issueKey: 'TASK-1', projectId: 'project-a' }]
        : [{ id: 'repository-a', slug: 'org/repo' }],
  );
  runtime.open.mockResolvedValue({
    commit: 'a'.repeat(40),
    execute: async () => 'context',
  });
  runtime.runAgent.mockResolvedValue({
    success: true,
    status: 'COMPLETED',
    result: { operation: 'answer', argument: 'Advice' },
  });
});
describe('private task code advice', () => {
  it('refuses machine callers', async () => {
    runtime.memberId = null;
    expect(await post(body)).toMatchObject({ success: false });
    expect(runtime.open).not.toHaveBeenCalled();
  });
  it('refuses denied issues before retrieving repository or AI context', async () => {
    runtime.denied = true;
    expect(await post(body)).toMatchObject({ success: false });
    expect(runtime.list).not.toHaveBeenCalled();
  });
  it('refuses repositories outside the issue project before reading credentials', async () => {
    runtime.runAgent.mockResolvedValueOnce({
      success: true,
      status: 'COMPLETED',
      result: {
        operation: 'file',
        argument: JSON.stringify({
          repositoryId: 'other-project-repo',
          argument: 'src/index.ts',
        }),
      },
    });
    expect(await post(body)).toMatchObject({ success: true });
    expect(runtime.open).not.toHaveBeenCalled();
    expect(runtime.runAgent.mock.calls[1][0].input).toContain(
      'repositoryId must be an id from the project repository catalogue',
    );
  });
  it('asks the model again after an unreadable reply', async () => {
    runtime.runAgent.mockResolvedValueOnce({
      success: true,
      status: 'INVALID_REPLY',
      error: 'The AI reply was not a valid JSON operation.',
      result: null,
      replyPreview: '{"operation":',
    });
    expect(await post(body)).toMatchObject({
      success: true,
      answer: 'Advice',
    });
    expect(runtime.runAgent.mock.calls[1][0].input).toContain(
      'could not be parsed',
    );
  });
  it('fails with a clear message when the model keeps replying unreadably', async () => {
    runtime.runAgent.mockResolvedValue({
      success: true,
      status: 'INVALID_REPLY',
      error: 'The AI reply was not a valid JSON operation.',
      result: null,
    });
    expect(await post(body)).toMatchObject({
      success: false,
      error: expect.stringContaining('unreadable replies (last reply: empty)'),
    });
    expect(runtime.runAgent).toHaveBeenCalledTimes(4);
  });
  it('asks for plain text after an empty reply', async () => {
    runtime.runAgent.mockResolvedValueOnce({
      success: true,
      status: 'INVALID_REPLY',
      error: 'The AI reply was not a valid JSON operation.',
      result: null,
      replyPreview: '',
    });
    expect(await post(body)).toMatchObject({ success: true });
    expect(runtime.runAgent.mock.calls[1][0].input).toContain(
      'not as a function or tool call',
    );
  });
  it('asks for an answer from the gathered context once every round was spent reading', async () => {
    runtime.runAgent.mockImplementation(async ({ input }: { input: string }) =>
      input.includes('inspection limit is reached')
        ? {
            success: true,
            status: 'COMPLETED',
            result: { operation: 'answer', argument: 'Best effort advice' },
          }
        : {
            success: true,
            status: 'COMPLETED',
            result: { operation: 'tree', argument: '' },
          },
    );
    expect(await post(body)).toMatchObject({
      success: true,
      answer: 'Best effort advice',
    });
    expect(runtime.runAgent).toHaveBeenCalledTimes(25);
    expect(runtime.runAgent.mock.calls[23][0].input).toContain(
      'This is your last round',
    );
  });
  it('stops reading near the request timeout and answers from what it has', async () => {
    const now = vi.spyOn(Date, 'now');
    let clock = 1_000_000;
    now.mockImplementation(() => clock);
    try {
      runtime.runAgent.mockImplementation(
        async ({ input }: { input: string }) => {
          clock += 60_000;
          return input.includes('inspection limit is reached')
            ? {
                success: true,
                status: 'COMPLETED',
                result: { operation: 'answer', argument: 'Timed advice' },
              }
            : {
                success: true,
                status: 'COMPLETED',
                result: { operation: 'tree', argument: '' },
              };
        },
      );
      expect(await post(body)).toMatchObject({
        success: true,
        answer: 'Timed advice',
      });
      expect(runtime.runAgent.mock.calls.length).toBeLessThan(8);
    } finally {
      now.mockRestore();
    }
  });
  it('still reports the inspection limit when the final answer request is not an answer', async () => {
    runtime.runAgent.mockResolvedValue({
      success: true,
      status: 'COMPLETED',
      result: { operation: 'tree', argument: '' },
    });
    expect(await post(body)).toMatchObject({
      success: false,
      error: expect.stringContaining('inspection limit'),
    });
  });
  it('hands a failed read back to the model instead of failing the turn', async () => {
    runtime.runAgent.mockResolvedValueOnce({
      success: true,
      status: 'COMPLETED',
      result: { operation: 'file', argument: 'missing.ts' },
    });
    runtime.open.mockResolvedValueOnce({
      commit: 'a'.repeat(40),
      execute: async () => {
        throw new Error('File is missing or exceeds 100 KB.');
      },
    });
    expect(await post(body)).toMatchObject({ success: true });
    expect(runtime.runAgent.mock.calls[1][0].input).toContain(
      'Read-only operation failed for repository org/repo: File is missing',
    );
  });
  it('inspects both project repositories automatically with one shared budget', async () => {
    const repositories = [
      { id: 'repository-a', slug: 'org/front' },
      { id: 'repository-b', slug: 'org/server' },
    ];
    runtime.list.mockImplementation(
      async ({
        pluralName,
        filter,
      }: {
        pluralName: string;
        filter: { id?: { eq: string } };
      }) =>
        pluralName === 'issues'
          ? [{ id: 'issue-a', projectId: 'project-a' }]
          : pluralName === 'repositories'
            ? repositories.filter(
                (repository) => !filter.id || repository.id === filter.id.eq,
              )
            : [],
    );
    runtime.open
      .mockResolvedValueOnce({
        commit: 'a'.repeat(40),
        execute: async () => 'frontend code',
      })
      .mockResolvedValueOnce({
        commit: 'b'.repeat(40),
        execute: async () => 'backend code',
      });
    for (const repository of repositories)
      runtime.runAgent.mockResolvedValueOnce({
        success: true,
        status: 'COMPLETED',
        result: {
          operation: 'file',
          argument: JSON.stringify({
            repositoryId: repository.id,
            argument: 'src/index.ts',
          }),
        },
      });
    expect(await post(body)).toMatchObject({
      success: true,
      sources: [
        { repository: 'org/front', sha: 'a'.repeat(40) },
        { repository: 'org/server', sha: 'b'.repeat(40) },
      ],
    });
    expect(runtime.runAgent.mock.calls[0][0].input).toContain('org/front');
    expect(runtime.runAgent.mock.calls[0][0].input).toContain('org/server');
    expect(runtime.open.mock.calls[0][2]).toBe(runtime.open.mock.calls[1][2]);
    expect(runtime.runAgent.mock.calls[2][0].input).toContain('backend code');
  });
  it('ignores forged member identities and pins repository evidence to the SHA', async () => {
    runtime.runAgent.mockResolvedValueOnce({
      success: true,
      status: 'COMPLETED',
      result: {
        operation: 'file',
        argument: JSON.stringify({
          repositoryId: 'repository-a',
          argument: 'src/index.ts',
        }),
      },
    });
    expect(
      await post({ ...body, runAsWorkspaceMemberId: 'victim' }),
    ).toMatchObject({ success: true, sha: 'a'.repeat(40), answer: 'Advice' });
    expect(runtime.runAgent.mock.calls[1][0].input).toContain('a'.repeat(40));
    expect(
      [...runtime.store.keys()].some((key) => key.includes('victim')),
    ).toBe(false);
  });
});

describe('private persistent history and cancellation', () => {
  it('records a repository opening failure without claiming a file was read', async () => {
    runtime.runAgent.mockResolvedValueOnce({
      success: true,
      status: 'COMPLETED',
      result: { operation: 'file', argument: 'src/example.ts' },
    });
    runtime.open.mockRejectedValueOnce(
      new Error('Repository connection unavailable'),
    );
    expect(await post(body)).toMatchObject({ success: false });
    const result = await post({ action: 'status', issueId: 'issue-a' });
    const run = result.run as {
      events: { operation: string; status: string }[];
    };
    expect(run.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation: 'Opening repository',
          status: 'failed',
        }),
        expect.objectContaining({
          operation: 'Reply failed',
          status: 'failed',
        }),
      ]),
    );
    expect(run.events.some((event) => event.operation === 'Reading file')).toBe(
      false,
    );
  });
  it('retains ordered progress events including short steps and final completion', async () => {
    const answer = await post(body);
    expect(answer).toMatchObject({
      success: true,
      run: { status: 'completed' },
    });
    const result = await post({ action: 'status', issueId: 'issue-a' });
    const run = result.run as {
      events: { sequence: number; operation: string; status: string }[];
    };
    expect(run.events.map((event) => event.sequence)).toEqual(
      run.events.map((_, index) => index + 1),
    );
    expect(run.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation: 'Preparing context',
          status: 'running',
        }),
        expect.objectContaining({
          operation: 'Preparing context',
          status: 'completed',
        }),
        expect.objectContaining({
          operation: 'Analyzing task',
          status: 'running',
        }),
        expect.objectContaining({
          operation: 'Analyzing task',
          status: 'completed',
        }),
        expect.objectContaining({
          operation: 'Reply ready',
          status: 'completed',
        }),
      ]),
    );
    runtime.memberId = 'member-b';
    expect(await post({ action: 'status', issueId: 'issue-a' })).toMatchObject({
      run: null,
    });
  });
  it('restores history only for the resolved caller and issue', async () => {
    await post(body);
    expect(
      await post({ action: 'initialize', issueId: 'issue-a' }),
    ).toMatchObject({ history: [{ answer: 'Advice' }] });
    runtime.memberId = 'member-b';
    expect(
      await post({
        action: 'initialize',
        issueId: 'issue-a',
        memberId: 'member-a',
      }),
    ).toMatchObject({ history: [] });
  });
  it('allows task-only advice without repository access', async () => {
    expect(await post({ ...body, repositoryId: '' })).toMatchObject({
      success: true,
      sha: '',
      repository: '',
    });
    expect(runtime.open).not.toHaveBeenCalled();
  });
  it('stops the operation loop after real cancellation and does not persist a reply', async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    runtime.runAgent.mockImplementation(async () => {
      await pending;
      return {
        success: true,
        status: 'COMPLETED',
        result: { operation: 'answer', argument: 'Advice' },
      };
    });
    const send = post(body);
    while (runtime.runAgent.mock.calls.length === 0)
      await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await post({ action: 'status', issueId: 'issue-a' })).toMatchObject({
      run: { status: 'running', question: body.message },
    });
    expect(await post({ action: 'cancel', issueId: 'issue-a' })).toMatchObject({
      cancellationRequested: true,
    });
    release?.();
    expect(await send).toMatchObject({
      success: false,
      error: 'Task AI run cancelled.',
    });
    expect(await post({ action: 'status', issueId: 'issue-a' })).toMatchObject({
      run: {
        status: 'cancelled',
        events: expect.arrayContaining([
          expect.objectContaining({
            operation: 'Analyzing task',
            status: 'cancelled',
          }),
        ]),
      },
    });
    expect(
      await post({ action: 'initialize', issueId: 'issue-a' }),
    ).toMatchObject({ history: [] });
  });
});

describe('live authorization and concurrency', () => {
  it('rejects a second simultaneous sender until the first model call finishes', async () => {
    let release: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    runtime.runAgent.mockImplementation(async () => {
      await pending;
      return {
        success: true,
        status: 'COMPLETED',
        result: { operation: 'answer', argument: 'Advice' },
      };
    });
    const first = post(body);
    while (runtime.runAgent.mock.calls.length === 0)
      await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await post(body)).toMatchObject({
      success: false,
      error: expect.stringContaining('already running'),
    });
    release?.();
    expect(await first).toMatchObject({ success: true });
    expect(runtime.locked).toBe(false);
  });
  it('rechecks revoked read permission before returning or saving advice', async () => {
    runtime.runAgent.mockImplementation(async () => {
      runtime.denied = true;
      return {
        success: true,
        status: 'COMPLETED',
        result: { operation: 'answer', argument: 'Advice' },
      };
    });
    expect(await post(body)).toMatchObject({ success: false, error: 'Denied' });
    expect(
      [...runtime.store.keys()].some((key) => key.endsWith(':history')),
    ).toBe(false);
    expect(runtime.locked).toBe(false);
  });
});

describe('mutable repository authorization', () => {
  it('rejects an unlinked repository before saving the completed model advice', async () => {
    runtime.runAgent.mockImplementation(async () => {
      runtime.list.mockImplementation(
        async ({ pluralName }: { pluralName: string }) =>
          pluralName === 'issues'
            ? [{ id: 'issue-a', projectId: 'project-a' }]
            : [],
      );
      return {
        success: true,
        status: 'COMPLETED',
        result: { operation: 'answer', argument: 'Old code advice' },
      };
    });
    expect(await post(body)).toMatchObject({
      success: false,
      error: expect.stringContaining('repository link changed'),
    });
    expect(
      [...runtime.store.keys()].some((key) => key.endsWith(':history')),
    ).toBe(false);
  });
});
