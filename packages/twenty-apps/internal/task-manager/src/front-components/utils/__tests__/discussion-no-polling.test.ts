// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    post = post;
  },
}));
import { TaskDiscussionNotifications } from '../../components/task-discussion-notifications';
import { useDiscussionState } from '../../hooks/use-discussion-state';

let root: Root;
let container: HTMLDivElement;
const DiscussionProbe = () => {
  useDiscussionState('issue-1');
  return null;
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  post.mockReset().mockResolvedValue({
    success: true,
    comments: [],
    reactions: [],
    readStates: [],
    members: [],
    currentMemberId: 'member-1',
    canWrite: true,
    canSoftDelete: false,
    notifications: [],
    unreadCount: 0,
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('discussion loading', () => {
  it('loads comments once and never refreshes them on a timer', async () => {
    await act(async () => root.render(createElement(DiscussionProbe)));
    expect(post).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(10 * 60 * 1000));
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('loads notifications on mount and when the bell is opened only', async () => {
    await act(async () =>
      root.render(createElement(TaskDiscussionNotifications)),
    );
    expect(post).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(10 * 60 * 1000));
    expect(post).toHaveBeenCalledTimes(1);
    await act(async () =>
      container
        .querySelector('button')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true })),
    );
    expect(post).toHaveBeenCalledTimes(2);
  });
});
