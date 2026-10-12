import { beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({
  records: {} as Record<string, Record<string, unknown>[]>,
  memberId: 'member-1',
  grants: ['read', 'write', 'softDelete'],
  query: vi.fn(),
  mutation: vi.fn(),
  publish: vi.fn(),
}));
vi.mock('twenty-sdk/define', () => ({
  defineLogicFunction: (config: unknown) => config,
}));
vi.mock('../utils/run-scoped-route.util', () => ({
  runScopedRoute: async (
    run: (context: unknown) => Promise<Record<string, unknown>>,
  ) => {
    try {
      return {
        success: true,
        ...(await run({
          client: { query: runtime.query, mutation: runtime.mutation },
          scope: {
            workspaceMemberId: runtime.memberId,
            canBypassAppScope: false,
            grantsByAppId: { 'app-1': runtime.grants },
          },
        })),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
}));

import createComment from '../create-issue-comment';
import updateComment from '../update-issue-comment';
import discussion from '../discussion-state';

type Selection = Record<
  string,
  {
    __args: {
      filter?: Record<string, { eq?: unknown; in?: unknown[] }>;
      first?: number;
      after?: string;
      id?: string;
      data?: Record<string, unknown>;
    };
  }
>;
const post = async (config: unknown, body: Record<string, unknown>) =>
  (
    config as {
      handler: (event: {
        body: Record<string, unknown>;
      }) => Promise<Record<string, unknown>>;
    }
  ).handler({ body });

beforeEach(() => {
  vi.clearAllMocks();
  runtime.memberId = 'member-1';
  runtime.grants = ['read', 'write', 'softDelete'];
  runtime.records = {
    issues: [
      { id: 'issue-1', projectId: 'project-1' },
      { id: 'issue-2', projectId: 'project-2' },
    ],
    projects: [
      { id: 'project-1', appId: 'app-1' },
      { id: 'project-2', appId: 'app-2' },
    ],
    appAccesses: [
      {
        id: 'access-1',
        memberId: 'member-1',
        appId: 'app-1',
        permissions: ['READ', 'WRITE'],
      },
      {
        id: 'access-2',
        memberId: 'member-2',
        appId: 'app-1',
        permissions: ['READ'],
      },
    ],
    workspaceMembers: [
      { id: 'member-1', name: { firstName: 'One' } },
      { id: 'member-2', name: { firstName: 'Two' } },
    ],
    issueComments: [],
    issueReactions: [],
    issueReadStates: [],
    issueNotifications: [],
  };
  runtime.query.mockImplementation(async (selection: Selection) => {
    const [pluralName, input] = Object.entries(selection)[0];
    const filtered = (runtime.records[pluralName] ?? []).filter((row) =>
      Object.entries(input.__args.filter ?? {}).every(([key, condition]) =>
        condition.in
          ? condition.in.includes(row[key])
          : row[key] === condition.eq,
      ),
    );
    return {
      [pluralName]: {
        edges: filtered
          .slice(0, input.__args.first ?? 200)
          .map((node) => ({ node, cursor: node.id })),
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    };
  });
  runtime.mutation.mockImplementation(async (selection: Selection) => {
    const [name, input] = Object.entries(selection)[0];
    const singular = name.replace(/^(create|update|delete)/, '');
    const plural = singular.charAt(0).toLowerCase() + singular.slice(1) + 's';
    const rows = runtime.records[plural] ?? (runtime.records[plural] = []);
    if (name.startsWith('create')) {
      const node = {
        id: input.__args.data?.id ?? `created-${rows.length}`,
        createdAt: '2026-10-11T12:00:00Z',
        ...input.__args.data,
      };
      if (rows.some((row) => row.id === node.id))
        throw new Error('duplicate key');
      rows.push(node);
      return { [name]: node };
    }
    if (name.startsWith('delete')) {
      runtime.records[plural] = rows.filter(
        (row) => row.id !== input.__args.id,
      );
      return { [name]: { id: input.__args.id } };
    }
    const row = rows.find((row) => row.id === input.__args.id);
    Object.assign(row ?? {}, input.__args.data);
    return { [name]: row };
  });
});

describe('task discussion', () => {
  it('rejects empty messages before writing', async () => {
    expect(
      await post(createComment, {
        issueId: 'issue-1',
        bodyV2: { markdown: '   ' },
      }),
    ).toMatchObject({ success: false });
    expect(runtime.records.issueComments).toHaveLength(0);
  });
  it('rejects replies to comments belonging to another task', async () => {
    runtime.records.issueComments.push({
      id: 'parent',
      issueId: 'issue-2',
      authorId: 'member-2',
    });
    expect(
      await post(createComment, {
        issueId: 'issue-1',
        parentCommentId: 'parent',
        bodyV2: { markdown: 'Reply' },
      }),
    ).toMatchObject({ success: false });
    expect(runtime.records.issueComments).toHaveLength(1);
  });
  it('creates one message and one notification for a retried request', async () => {
    const body = {
      issueId: 'issue-1',
      requestId: 'retry-request',
      mentionMemberIds: ['member-2', 'member-2'],
      bodyV2: { markdown: 'Hello @Two' },
    };
    expect(await post(createComment, body)).toMatchObject({ success: true });
    expect(await post(createComment, body)).toMatchObject({ success: true });
    expect(runtime.records.issueComments).toHaveLength(1);
    expect(runtime.records.issueNotifications).toHaveLength(1);
    expect(runtime.records.issueNotifications[0]).toMatchObject({
      recipientId: 'member-2',
      actorId: 'member-1',
    });
  });
  it('does not notify extra members when a send is retried with changed mention ids', async () => {
    const body = {
      issueId: 'issue-1',
      requestId: 'stable',
      mentionMemberIds: [],
      bodyV2: { markdown: 'Original' },
    };
    await post(createComment, body);
    await post(createComment, { ...body, mentionMemberIds: ['member-2'] });
    expect(runtime.records.issueNotifications).toHaveLength(0);
  });
  it('keeps the original reply recipient when a request identifier is reused', async () => {
    runtime.records.appAccesses.push({
      id: 'access-3',
      memberId: 'member-3',
      appId: 'app-1',
      permissions: ['READ'],
    });
    runtime.records.workspaceMembers.push({ id: 'member-3' });
    runtime.records.issueComments.push(
      { id: 'parent-a', issueId: 'issue-1', authorId: 'member-2' },
      { id: 'parent-b', issueId: 'issue-1', authorId: 'member-3' },
    );
    const body = {
      issueId: 'issue-1',
      requestId: 'same-reply',
      parentCommentId: 'parent-a',
      bodyV2: { markdown: 'Reply' },
    };
    await post(createComment, body);
    await post(createComment, { ...body, parentCommentId: 'parent-b' });
    expect(runtime.records.issueNotifications).toHaveLength(1);
    expect(runtime.records.issueNotifications[0].recipientId).toBe('member-2');
  });
  it('hides deleted message notifications and refreshes edited previews', async () => {
    runtime.records.issueComments.push({
      id: 'edited',
      issueId: 'issue-1',
      bodyV2: { markdown: 'Updated' },
    });
    runtime.records.issueNotifications.push(
      {
        id: 'live',
        recipientId: 'member-1',
        issueId: 'issue-1',
        commentId: 'edited',
        body: 'Old',
        readAt: null,
      },
      {
        id: 'gone',
        recipientId: 'member-1',
        issueId: 'issue-1',
        commentId: 'deleted',
        body: 'Deleted',
        readAt: null,
      },
    );
    expect(await post(discussion, { action: 'notifications' })).toMatchObject({
      success: true,
      unreadCount: 1,
      notifications: [{ id: 'live', body: 'Updated' }],
    });
  });
  it('rejects mentions without read access to the app', async () => {
    expect(
      await post(createComment, {
        issueId: 'issue-1',
        mentionMemberIds: ['outsider'],
        bodyV2: { markdown: 'Hello' },
      }),
    ).toMatchObject({ success: false });
    expect(runtime.records.issueComments).toHaveLength(0);
  });
  it('keeps comment author and task immutable during edits', async () => {
    runtime.records.issueComments.push({
      id: 'comment-1',
      issueId: 'issue-1',
      authorId: 'member-1',
    });
    expect(
      await post(updateComment, {
        issueCommentId: 'comment-1',
        data: {
          authorId: 'member-2',
          issueId: 'issue-1',
          bodyV2: { markdown: 'Edited' },
        },
      }),
    ).toMatchObject({ success: false });
    expect(runtime.records.issueComments[0]).toMatchObject({
      authorId: 'member-1',
      issueId: 'issue-1',
    });
  });
  it('does not expose a discussion from another app', async () => {
    expect(
      await post(discussion, { action: 'snapshot', issueId: 'issue-2' }),
    ).toMatchObject({ success: false });
  });
  it('keeps reaction toggle idempotent and scoped to the actor', async () => {
    runtime.records.issueComments.push({
      id: 'comment-1',
      issueId: 'issue-1',
      authorId: 'member-2',
    });
    const body = {
      action: 'react',
      issueId: 'issue-1',
      commentId: 'comment-1',
      emoji: '👍',
      active: true,
    };
    expect(await post(discussion, body)).toMatchObject({ success: true });
    expect(await post(discussion, body)).toMatchObject({ success: true });
    expect(runtime.records.issueReactions).toHaveLength(1);
    expect(runtime.records.issueReactions[0]).toMatchObject({
      memberId: 'member-1',
    });
    expect(await post(discussion, { ...body, active: false })).toMatchObject({
      success: true,
    });
    expect(runtime.records.issueReactions[0]).toMatchObject({
      isActive: false,
    });
    expect(await post(discussion, body)).toMatchObject({ success: true });
    expect(runtime.records.issueReactions).toHaveLength(1);
    expect(runtime.records.issueReactions[0]).toMatchObject({ isActive: true });
  });
  it('rejects cross-task reactions', async () => {
    runtime.records.issueComments.push({
      id: 'other-comment',
      issueId: 'issue-2',
    });
    expect(
      await post(discussion, {
        action: 'react',
        issueId: 'issue-1',
        commentId: 'other-comment',
        emoji: '👍',
        active: true,
      }),
    ).toMatchObject({ success: false });
    expect(runtime.records.issueReactions).toHaveLength(0);
  });
  it('only exposes notifications for the caller and rechecks task access', async () => {
    runtime.records.issueComments.push({
      id: 'mentioned',
      issueId: 'issue-1',
      bodyV2: { markdown: 'Current message' },
    });
    runtime.records.issueNotifications.push(
      {
        id: 'own',
        recipientId: 'member-1',
        issueId: 'issue-1',
        commentId: 'mentioned',
        readAt: null,
      },
      {
        id: 'other',
        recipientId: 'member-2',
        issueId: 'issue-1',
        commentId: 'mentioned',
        readAt: null,
      },
      {
        id: 'revoked',
        recipientId: 'member-1',
        issueId: 'issue-2',
        readAt: null,
      },
    );
    expect(await post(discussion, { action: 'notifications' })).toMatchObject({
      success: true,
      unreadCount: 1,
      notifications: [{ id: 'own' }],
    });
    expect(
      await post(discussion, {
        action: 'readNotification',
        notificationId: 'other',
      }),
    ).toMatchObject({ success: false });
  });
  it('records separate receipts for each viewed comment using message time', async () => {
    runtime.records.issueComments.push(
      { id: 'new', issueId: 'issue-1', createdAt: '2026-10-11T12:00:00Z' },
      { id: 'old', issueId: 'issue-1', createdAt: '2026-10-11T11:00:00Z' },
    );
    expect(
      await post(discussion, {
        action: 'read',
        issueId: 'issue-1',
        commentId: 'new',
      }),
    ).toMatchObject({ success: true });
    expect(
      await post(discussion, {
        action: 'read',
        issueId: 'issue-1',
        commentId: 'old',
      }),
    ).toMatchObject({ success: true });
    expect(runtime.records.issueReadStates[0]).toMatchObject({
      memberId: 'member-1',
      commentId: 'new',
      lastReadAt: '2026-10-11T12:00:00Z',
    });
  });
});
