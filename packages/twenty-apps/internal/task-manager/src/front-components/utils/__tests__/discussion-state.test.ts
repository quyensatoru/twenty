// @vitest-environment jsdom
import { getByRole } from '@testing-library/dom';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    post = post;
  },
}));
vi.mock('twenty-sdk/front-component', () => ({ t: (text: string) => text }));
import {
  type DiscussionSnapshot,
  useDiscussionState,
} from '../../hooks/use-discussion-state';
let root: Root;
let container: HTMLDivElement;
let reload: () => Promise<void>;
let react: (active: boolean) => Promise<void>;
const Harness = ({ targetCommentId = null }: { targetCommentId?: string | null }) => {
  const discussion = useDiscussionState('issue', targetCommentId);
  reload = discussion.reload;
  react = (active) =>
    discussion.act('react', { commentId: 'comment', emoji: '👍', active });
  return createElement(
    'output',
    {},
    JSON.stringify({
      snapshot: discussion.snapshot,
      error: discussion.error,
      denied: discussion.isPermissionDenied,
    }),
  );
};
const snapshot = {
  success: true,
  comments: [{ id: 'comment' }],
  reactions: [],
  readStates: [],
  members: [],
  currentMemberId: 'alice',
  canWrite: true,
  canSoftDelete: true,
};
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  post.mockReset().mockResolvedValue(snapshot);
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});
describe('discussion snapshot concurrency', () => {
  it('loads earlier pages until a linked comment is present', async () => {
    post
      .mockResolvedValueOnce({
        ...snapshot,
        comments: [{ id: 'recent-comment' }],
        nextCursor: 'older-page',
      })
      .mockResolvedValueOnce({
        ...snapshot,
        comments: [{ id: 'linked-comment' }],
        nextCursor: null,
      });

    await act(async () => root.render(createElement(Harness, { targetCommentId: 'linked-comment' })));

    const rendered = getByRole(container, 'status').textContent ?? '';
    expect(rendered).toContain('recent-comment');
    expect(rendered).toContain('linked-comment');
    expect(post.mock.calls[1][1]).toMatchObject({ cursor: 'older-page' });
  });

  it('resolves image URLs from signed TipTap data and keeps unchanged image previews stable', async () => {
    const fileUrl =
      'https://example.com/file/workspace/12345678-1234-1234-1234-123456789abc';
    const imageComment = (signedToken: string, markdown: string) => ({
      id: 'image-comment',
      bodyV2: {
        markdown,
        tiptap: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'image', attrs: { src: `${fileUrl}?token=${signedToken}` } },
          ],
        }),
      },
    });
    post.mockResolvedValueOnce({
      ...snapshot,
      comments: [
        imageComment(
          'fresh-token',
          `![Screenshot](${fileUrl}?token=expired-token)`,
        ),
      ],
    });
    await act(async () => root.render(createElement(Harness)));
    const renderedSnapshot = () =>
      (
        JSON.parse(getByRole(container, 'status').textContent ?? '{}') as {
          snapshot: DiscussionSnapshot;
        }
      ).snapshot;
    expect(renderedSnapshot().comments[0].bodyV2?.markdown).toBe(
      `![Screenshot](${fileUrl}?token=fresh-token)`,
    );
    post.mockResolvedValueOnce({
      ...snapshot,
      comments: [
        imageComment(
          'renewed-token',
          `![Screenshot](${fileUrl}?token=expired-token)`,
        ),
      ],
    });
    await act(async () => reload());
    expect(renderedSnapshot().comments[0].bodyV2?.markdown).toBe(
      `![Screenshot](${fileUrl}?token=fresh-token)`,
    );
    post.mockResolvedValueOnce({
      ...snapshot,
      comments: [
        imageComment(
          'latest-token',
          `Updated ![Screenshot](${fileUrl}?token=expired-token)`,
        ),
      ],
    });
    await act(async () => reload());
    expect(renderedSnapshot().comments[0].bodyV2?.markdown).toBe(
      `Updated ![Screenshot](${fileUrl}?token=latest-token)`,
    );
  });
  it('updates reactions immediately and preserves them through a stale poll', async () => {
    await act(async () => root.render(createElement(Harness)));
    let finish: (value: unknown) => void = () => undefined;
    post.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    let pending: Promise<void>;
    await act(async () => {
      pending = react(true);
    });
    expect(getByRole(container, 'status').textContent).toContain(
      '"emoji":"👍"',
    );
    await act(async () => reload());
    expect(getByRole(container, 'status').textContent).toContain(
      '"emoji":"👍"',
    );
    await act(async () => {
      finish({ success: true });
      await pending;
    });
  });
  it('serializes rapid toggles while showing the latest choice immediately', async () => {
    await act(async () => root.render(createElement(Harness)));
    let finish: (value: unknown) => void = () => undefined;
    post.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    let pending: Promise<void>;
    await act(async () => {
      pending = react(true);
    });
    await act(async () => react(false));
    expect(getByRole(container, 'status').textContent).not.toContain(
      '"emoji":"👍"',
    );
    expect(
      post.mock.calls.filter((call) => call[1]?.action === 'react'),
    ).toHaveLength(1);
    await act(async () => {
      finish({ success: true });
      await pending;
    });
    expect(
      post.mock.calls
        .filter((call) => call[1]?.action === 'react')
        .map((call) => call[1].active),
    ).toEqual([true, false]);
  });
  it('rolls back failed reactions and exposes the error', async () => {
    await act(async () => root.render(createElement(Harness)));
    post.mockRejectedValueOnce(new Error('Offline'));
    await act(async () => {
      await react(true).catch(() => undefined);
    });
    expect(getByRole(container, 'status').textContent).not.toContain(
      '"emoji":"👍"',
    );
    expect(getByRole(container, 'status').textContent).toContain('Offline');
  });
  it('clears the snapshot and its grants after permission denial', async () => {
    await act(async () => root.render(createElement(Harness)));
    expect(getByRole(container, 'status').textContent).toContain(
      '"canWrite":true',
    );
    post.mockRejectedValueOnce(new Error('PERMISSION_DENIED'));
    await act(async () => reload());
    expect(getByRole(container, 'status').textContent).toContain(
      '"snapshot":null',
    );
    expect(getByRole(container, 'status').textContent).toContain(
      '"denied":true',
    );
  });
  it('ignores older failing requests after a newer snapshot succeeds', async () => {
    await act(async () => root.render(createElement(Harness)));
    let failOlder: (reason: Error) => void = () => undefined;
    post
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            failOlder = reject;
          }),
      )
      .mockResolvedValueOnce({
        ...snapshot,
        comments: [{ id: 'new-comment' }],
      });
    let older: Promise<void>;
    await act(async () => {
      older = reload();
      await reload();
    });
    await act(async () => {
      failOlder(new Error('PERMISSION_DENIED'));
      await older;
    });
    expect(getByRole(container, 'status').textContent).toContain('new-comment');
    expect(getByRole(container, 'status').textContent).toContain(
      '"denied":false',
    );
  });
});
