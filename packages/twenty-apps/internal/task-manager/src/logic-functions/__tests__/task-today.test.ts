import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type CallerScope } from '../../types/caller-scope';
import { type TaskTodayData } from '../../types/task-today';
import { addTaskTodayDays } from '../../utils/task-today-date.util';

const runtime = vi.hoisted(() => ({
  scope: {
    workspaceMemberId: 'me',
    canBypassAppScope: false,
    canManageViews: false,
    grantsByAppId: { app: ['read'] },
  } as CallerScope,
  query: vi.fn(),
  visibleProjects: vi.fn(),
  notifications: vi.fn(),
  records: {} as Record<string, Record<string, unknown>[]>,
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
vi.mock('../app-scope/list-visible-project-ids.util', () => ({
  listVisibleProjectIds: runtime.visibleProjects,
}));
vi.mock('../utils/discussion-storage.util', () => ({
  listVisibleDiscussionNotifications: runtime.notifications,
}));

import today from '../task-today';

type Filter = Record<string, unknown>;
const matches = (row: Record<string, unknown>, filter: Filter): boolean =>
  Object.entries(filter).every(([field, condition]) => {
    if (field === 'and')
      return (condition as Filter[]).every((part) => matches(row, part));
    if (field === 'or')
      return (condition as Filter[]).some((part) => matches(row, part));
    if (field === 'not') return !matches(row, condition as Filter);
    if (Object.keys(condition as Filter).length !== 1)
      throw new Error('A field filter must have exactly one operator.');
    const value = row[field];
    return Object.entries(condition as Filter).every(([operator, expected]) => {
      if (operator === 'eq') return value === expected;
      if (operator === 'in') return (expected as unknown[]).includes(value);
      if (operator === 'is') return value == null;
      if (value == null) return false;
      if (operator === 'lt')
        return (
          new Date(String(value)).getTime() <
          new Date(String(expected)).getTime()
        );
      if (operator === 'gte')
        return (
          new Date(String(value)).getTime() >=
          new Date(String(expected)).getTime()
        );
      throw new Error(`Unsupported test operator: ${operator}`);
    });
  });

const run = (body: Record<string, unknown>) =>
  (
    today as unknown as {
      handler: (event: {
        body: Record<string, unknown>;
      }) => Promise<TaskTodayData>;
    }
  ).handler({
    body: {
      startOfDay: `${body.day}T00:00:00.000Z`,
      nextDay: `${addTaskTodayDays(String(body.day), 1)}T00:00:00.000Z`,
      upcomingEnd: `${addTaskTodayDays(String(body.day), 8)}T00:00:00.000Z`,
      ...body,
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  runtime.scope.workspaceMemberId = 'me';
  runtime.scope.canBypassAppScope = false;
  runtime.visibleProjects.mockResolvedValue(['project']);
  runtime.notifications.mockResolvedValue([]);
  runtime.records = {
    projects: [{ id: 'project', name: 'Project', appId: 'app' }],
    issueStatuses: [
      { id: 'todo', projectId: 'project', category: 'UNSTARTED' },
      { id: 'started', projectId: 'project', category: 'STARTED' },
      { id: 'done', projectId: 'project', category: 'DONE' },
    ],
    issues: [
      {
        id: 'overdue',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-10-11',
        statusId: null,
      },
      {
        id: 'today',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-10-12',
        statusId: 'started',
      },
      {
        id: 'tomorrow',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-10-13',
        statusId: 'todo',
      },
      {
        id: 'next-week',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-10-19',
        statusId: 'todo',
      },
      {
        id: 'later',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-10-20',
        statusId: 'todo',
      },
      {
        id: 'undated',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: null,
        statusId: 'todo',
      },
      {
        id: 'finished',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-10-10',
        statusId: 'done',
        updatedAt: '2026-10-12T00:00:00Z',
      },
      {
        id: 'someone-else',
        projectId: 'project',
        assigneeId: 'other',
        dueDate: '2026-10-10',
        statusId: 'todo',
      },
      {
        id: 'private',
        projectId: 'private-project',
        assigneeId: 'me',
        dueDate: '2026-10-10',
        statusId: 'todo',
      },
    ],
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
      const filtered = (runtime.records[pluralName] ?? []).filter((row) =>
        matches(row, input.__args.filter),
      );
      const offset = input.__args.after ? Number(input.__args.after) : 0;
      const page = filtered.slice(offset, offset + input.__args.first);
      return {
        [pluralName]: {
          totalCount: filtered.length,
          edges: input.edges
            ? page.map((node, index) => ({
                node,
                cursor: String(offset + index + 1),
              }))
            : [],
          pageInfo: {
            endCursor: String(offset + page.length),
            hasNextPage: offset + page.length < filtered.length,
          },
        },
      };
    },
  );
});

describe('Today personal queue', () => {
  it('groups deadlines around the reader’s local midnight, rather than UTC midnight', async () => {
    runtime.records.issues = [
      {
        id: 'before',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-10-11T16:59:59Z',
      },
      {
        id: 'midnight',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-10-11T17:00:00Z',
      },
      {
        id: 'evening',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-10-12T16:59:59Z',
      },
      {
        id: 'tomorrow',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-10-12T17:00:00Z',
      },
    ];
    const result = await run({
      day: '2026-10-12',
      section: 'today',
      startOfDay: '2026-10-11T17:00:00Z',
      nextDay: '2026-10-12T17:00:00Z',
      upcomingEnd: '2026-10-19T17:00:00Z',
    });
    expect(result.issues.map((issue) => issue.id)).toEqual([
      'midnight',
      'evening',
    ]);
    expect(result.counts).toMatchObject({ overdue: 1, today: 2, upcoming: 1 });
  });

  it('shows only the caller’s accessible open work, including issues with no status', async () => {
    const result = await run({ day: '2026-10-12' });
    expect(result.success).toBe(true);
    expect(result.issues.map((issue) => issue.id)).toEqual(['overdue']);
    expect(result.counts).toMatchObject({
      overdue: 1,
      today: 1,
      upcoming: 2,
      inProgress: 1,
      noDueDate: 1,
    });
    expect(result.projects[0].canWrite).toBe(false);
  });

  it('uses the supplied local calendar date across month and year boundaries', async () => {
    runtime.records.issues = [
      {
        id: 'today',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2026-12-31',
        statusId: 'todo',
      },
      {
        id: 'next-year',
        projectId: 'project',
        assigneeId: 'me',
        dueDate: '2027-01-01',
        statusId: 'todo',
      },
    ];
    const result = await run({ day: '2026-12-31', section: 'upcoming' });
    expect(result.counts.today).toBe(1);
    expect(result.issues.map((issue) => issue.id)).toEqual(['next-year']);
  });

  it('fails closed when a user has no projects or the caller has no member', async () => {
    runtime.visibleProjects.mockResolvedValue([]);
    expect((await run({ day: '2026-10-12' })).issues).toEqual([]);
    expect(runtime.query).not.toHaveBeenCalled();
    runtime.scope.workspaceMemberId = null;
    runtime.scope.canBypassAppScope = true;
    expect((await run({ day: '2026-10-12' })).hasMember).toBe(false);
    expect(runtime.notifications).not.toHaveBeenCalled();
    expect(runtime.query).not.toHaveBeenCalled();
  });

  it('keeps the personal assignment filter for administrators who bypass app scope', async () => {
    runtime.scope.canBypassAppScope = true;
    runtime.visibleProjects.mockResolvedValue(null);
    const result = await run({ day: '2026-10-12' });
    expect(result.issues.map((issue) => issue.id)).toEqual([
      'overdue',
      'private',
    ]);
  });

  it('paginates the selected queue while preserving the full count', async () => {
    runtime.records.issues = Array.from({ length: 19 }, (_, index) => ({
      id: `issue-${index}`,
      projectId: 'project',
      assigneeId: 'me',
      dueDate: '2026-10-11',
    }));
    const first = await run({ day: '2026-10-12' });
    expect(first.issues).toHaveLength(15);
    expect(first.counts.overdue).toBe(19);
    expect(first.hasNextPage).toBe(true);
    const second = await run({ day: '2026-10-12', after: first.endCursor });
    expect(second.issues).toHaveLength(4);
    expect(second.counts.overdue).toBe(19);
    expect(second.hasNextPage).toBe(false);
  });

  it('counts all visible unread messages, showing the latest five', async () => {
    runtime.notifications.mockResolvedValue([
      ...Array.from({ length: 7 }, (_, index) => ({
        id: String(index),
        readAt: null,
      })),
      { id: 'read', readAt: '2026-10-12' },
    ]);
    const result = await run({ day: '2026-10-12' });
    expect(result.unreadCount).toBe(7);
    expect(result.notifications.map((notification) => notification.id)).toEqual(
      ['0', '1', '2', '3', '4'],
    );
  });

  it('rejects invalid dates and unknown sections before querying', async () => {
    expect(await run({ day: '2026-02-30' })).toMatchObject({ success: false });
    expect(
      await run({ day: '2026-10-12', section: 'everything' }),
    ).toMatchObject({ success: false });
    expect(runtime.query).not.toHaveBeenCalled();
  });
});
