import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type CallerScope } from '../../types/caller-scope';
import { type PersonalBoardData } from '../../types/task-personal-board';

const runtime = vi.hoisted(() => ({
  scope: {
    workspaceMemberId: 'me',
    canBypassAppScope: false,
    canManageViews: false,
    grantsByAppId: { app: ['read'] },
  } as CallerScope,
  query: vi.fn(),
  mutation: vi.fn(),
  visibleProjects: vi.fn(),
  assertRecord: vi.fn(),
  records: {} as Record<string, Record<string, unknown>[]>,
}));
vi.mock('twenty-sdk/define', () => ({
  defineLogicFunction: (config: unknown) => config,
}));
vi.mock('../utils/run-scoped-route.util', () => ({
  runScopedRoute: async (
    run: (context: {
      client: {
        query: typeof runtime.query;
        mutation: typeof runtime.mutation;
      };
      scope: CallerScope;
    }) => Promise<Record<string, unknown>>,
  ) => {
    try {
      return {
        success: true,
        ...(await run({
          client: { query: runtime.query, mutation: runtime.mutation },
          scope: runtime.scope,
        })),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
}));
vi.mock('../app-scope/list-visible-project-ids.util', () => ({
  listVisibleProjectIds: runtime.visibleProjects,
}));
vi.mock('../app-scope/assert-record-in-scope.util', () => ({
  assertRecordInScope: runtime.assertRecord,
}));

import route from '../task-personal-board';
import { getPersonalBoardStateId } from '../utils/personal-board-storage.util';

type Filter = Record<string, unknown>;
const matches = (row: Record<string, unknown>, filter: Filter): boolean =>
  Object.entries(filter).every(([field, condition]) => {
    if (field === 'and')
      return (condition as Filter[]).every((part) => matches(row, part));
    if (field === 'or')
      return (condition as Filter[]).some((part) => matches(row, part));
    if (field === 'not') return !matches(row, condition as Filter);
    if (Object.keys(condition as Filter).length !== 1)
      throw new Error('One field operator is required.');
    return Object.entries(condition as Filter).every(([operator, expected]) => {
      if (operator === 'eq') return row[field] === expected;
      if (operator === 'in')
        return (expected as unknown[]).includes(row[field]);
      if (operator === 'is') return row[field] == null;
      if (operator === 'gte')
        return (
          row[field] != null &&
          new Date(String(row[field])) >= new Date(String(expected))
        );
      throw new Error(`Unsupported operator: ${operator}`);
    });
  });
const run = (body: Record<string, unknown> = {}) =>
  (
    route as unknown as {
      handler: (event: {
        body: Record<string, unknown>;
      }) => Promise<
        PersonalBoardData & { error?: string; plan?: Record<string, unknown> }
      >;
    }
  ).handler({ body });

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-13T08:00:00Z'));
  runtime.scope.workspaceMemberId = 'me';
  runtime.scope.canBypassAppScope = false;
  runtime.visibleProjects.mockResolvedValue(['project']);
  runtime.assertRecord.mockResolvedValue(undefined);
  runtime.records = {
    projects: [{ id: 'project', appId: 'app', name: 'Project' }],
    issueStatuses: [
      { id: 'todo', projectId: 'project', category: 'UNSTARTED' },
      { id: 'done', projectId: 'project', category: 'DONE' },
    ],
    issues: [
      {
        id: 'open',
        projectId: 'project',
        assigneeId: 'me',
        statusId: 'todo',
        dueDate: '2026-10-13',
      },
      { id: 'undated', projectId: 'project', assigneeId: 'me', statusId: null },
      {
        id: 'recent-done',
        projectId: 'project',
        assigneeId: 'me',
        statusId: 'done',
        updatedAt: '2026-10-12',
      },
      {
        id: 'old-done',
        projectId: 'project',
        assigneeId: 'me',
        statusId: 'done',
        updatedAt: '2026-09-01',
      },
      {
        id: 'someone-else',
        projectId: 'project',
        assigneeId: 'other',
        statusId: 'todo',
      },
      {
        id: 'hidden',
        projectId: 'private',
        assigneeId: 'me',
        statusId: 'todo',
      },
    ],
    taskPersonalBoardStates: [],
  };
  runtime.query.mockImplementation(
    async (
      selection: Record<
        string,
        {
          __args: { filter: Filter; first: number; after?: string };
          edges?: unknown;
        }
      >,
    ) => {
      const [pluralName, input] = Object.entries(selection)[0];
      const rows = (runtime.records[pluralName] ?? []).filter((row) =>
        matches(row, input.__args.filter),
      );
      const offset = Number(input.__args.after ?? 0);
      const page = rows.slice(offset, offset + input.__args.first);
      return {
        [pluralName]: {
          totalCount: rows.length,
          edges: page.map((node, index) => ({
            node,
            cursor: String(offset + index + 1),
          })),
          pageInfo: {
            endCursor: String(offset + page.length),
            hasNextPage: offset + page.length < rows.length,
          },
        },
      };
    },
  );
  runtime.mutation.mockImplementation(
    async (
      selection: Record<
        string,
        { __args: { id?: string; data: Record<string, unknown> } }
      >,
    ) => {
      const [name, input] = Object.entries(selection)[0];
      const rows = runtime.records.taskPersonalBoardStates;
      if (name === 'createTaskPersonalBoardState') {
        rows.push(input.__args.data);
        return { [name]: input.__args.data };
      }
      if (name === 'updateTaskPersonalBoardState') {
        const row = rows.find((candidate) => candidate.id === input.__args.id);
        Object.assign(row ?? {}, input.__args.data);
        return { [name]: row };
      }
      throw new Error(`Unexpected shared write: ${name}`);
    },
  );
});
afterEach(() => vi.useRealTimers());

describe('Personal member board', () => {
  it('reads only the caller’s accessible assigned work and recent completed tasks', async () => {
    const result = await run({ memberId: 'other' });
    expect(result.success).toBe(true);
    expect(result.issues.map((issue) => issue.id)).toEqual([
      'open',
      'undated',
      'recent-done',
    ]);
    expect(result.projects[0].canWrite).toBe(false);
    expect(result.memberId).toBe('me');
  });
  it('retains assignment scoping for administrators', async () => {
    runtime.scope.canBypassAppScope = true;
    runtime.visibleProjects.mockResolvedValue(null);
    expect((await run()).issues.map((issue) => issue.id)).toEqual([
      'open',
      'undated',
      'recent-done',
      'hidden',
    ]);
  });
  it('rejects machine tokens and never reads another member’s preferences', async () => {
    runtime.records.taskPersonalBoardStates.push({
      id: getPersonalBoardStateId('other', null),
      memberId: 'other',
      issueId: null,
      configuration: { workView: 'list', density: 'compact' },
    });
    expect((await run()).preferences.workView).toBe('desk');
    runtime.scope.workspaceMemberId = null;
    runtime.scope.canBypassAppScope = true;
    expect(
      await run({ action: 'preferences', patch: { workView: 'list' } }),
    ).toMatchObject({ success: false });
    expect(runtime.mutation).not.toHaveBeenCalled();
  });
  it('normalizes a saved Room preference to Desk without losing other preferences', async () => {
    runtime.records.taskPersonalBoardStates.push({
      id: getPersonalBoardStateId('me', null),
      memberId: 'me',
      issueId: null,
      configuration: {
        workView: 'board',
        density: 'compact',
        effectsEnabled: false,
      },
    });
    expect((await run()).preferences).toMatchObject({
      workView: 'desk',
      density: 'compact',
      effectsEnabled: false,
    });
  });
  it('stores personal planning without changing the shared status or deadline', async () => {
    const sharedBefore = structuredClone(runtime.records.issues);
    await run({
      action: 'plan',
      issueId: 'open',
      patch: { column: 'today', rank: 1024 },
    });
    await run({ action: 'plan', issueId: 'open', patch: { isPinned: true } });
    expect((await run()).plans.open).toEqual({
      column: 'today',
      rank: 1024,
      isPinned: true,
    });
    expect(runtime.records.issues).toEqual(sharedBefore);
    expect(runtime.records.taskPersonalBoardStates).toHaveLength(1);
    expect(runtime.assertRecord).toHaveBeenCalledWith(
      expect.objectContaining({ recordId: 'open', operation: 'read' }),
    );
  });
  it('refuses to plan another member’s task or an inaccessible task', async () => {
    expect(
      await run({
        action: 'plan',
        issueId: 'someone-else',
        patch: { column: 'today' },
      }),
    ).toMatchObject({ success: false });
    runtime.assertRecord.mockRejectedValueOnce(new Error('Access denied'));
    expect(
      await run({
        action: 'plan',
        issueId: 'hidden',
        patch: { column: 'today' },
      }),
    ).toMatchObject({ success: false });
    expect(runtime.mutation).not.toHaveBeenCalled();
  });
  it('merges individual preferences and isolates them by authenticated member', async () => {
    await run({
      action: 'preferences',
      patch: {
        workView: 'list',
        density: 'compact',
        collapsedColumns: ['done'],
      },
    });
    await run({ action: 'preferences', patch: { projectId: 'project' } });
    await run({
      action: 'preferences',
      patch: {
        boardSort: [
          { field: 'priority', direction: 'desc' },
          { field: 'createdAt', direction: 'asc' },
        ],
      },
    });
    expect((await run()).preferences).toEqual({
      workView: 'list',
      density: 'compact',
      projectId: 'project',
      collapsedColumns: ['done'],
      effectsEnabled: true,
      boardSort: [
        { field: 'priority', direction: 'desc' },
        { field: 'createdAt', direction: 'asc' },
      ],
    });
    runtime.scope.workspaceMemberId = 'other';
    expect((await run()).preferences).toMatchObject({
      workView: 'desk',
      density: 'comfortable',
      projectId: null,
      boardSort: [],
    });
  });

  it('reads the earlier saved shapes as a sort of at most one rule', async () => {
    await run({
      action: 'preferences',
      patch: { boardSort: { field: 'dueDate', direction: 'asc' } },
    });
    expect((await run()).preferences.boardSort).toEqual([
      { field: 'dueDate', direction: 'asc' },
    ]);
    await run({ action: 'preferences', patch: { boardSort: 'newest' } });
    expect((await run()).preferences.boardSort).toEqual([]);
  });
  it('paginates the full queue and returns only planning for visible tasks on that page', async () => {
    runtime.records.issues = Array.from({ length: 82 }, (_, index) => ({
      id: `issue-${index}`,
      assigneeId: 'me',
      projectId: 'project',
    }));
    runtime.records.taskPersonalBoardStates = [
      {
        id: 'personal',
        memberId: 'me',
        issueId: 'issue-81',
        configuration: { column: 'next' },
      },
      {
        id: 'other-personal',
        memberId: 'other',
        issueId: 'issue-1',
        configuration: { column: 'today' },
      },
    ];
    const first = await run();
    expect(first.issues).toHaveLength(75);
    expect(first.totalCount).toBe(82);
    expect(first.plans).toEqual({});
    const second = await run({ after: first.endCursor });
    expect(second.issues).toHaveLength(7);
    expect(second.hasNextPage).toBe(false);
    expect(second.plans['issue-81'].column).toBe('next');
  });
  it('keeps preferences available when the caller has no accessible projects', async () => {
    runtime.visibleProjects.mockResolvedValue([]);
    await run({ action: 'preferences', patch: { workView: 'list' } });
    const result = await run();
    expect(result.issues).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.preferences.workView).toBe('list');
  });
  it.each([
    { column: 'done' },
    { rank: Infinity },
    { rank: 1e12 },
    { isPinned: 'yes' },
  ])('rejects invalid planning updates %j', async (patch) => {
    expect(await run({ action: 'plan', issueId: 'open', patch })).toMatchObject(
      { success: false },
    );
    expect(runtime.mutation).not.toHaveBeenCalled();
  });
});
