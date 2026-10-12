// @vitest-environment jsdom
import { getByRole, queryByRole } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
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
vi.mock('../../utils/read-record-page-base-url.util', () => ({
  readRecordPageBaseUrl: () => 'https://example.com',
}));
import { TaskDiscussionNotifications } from '../../components/task-discussion-notifications';
let root: Root;
let container: HTMLDivElement;
const notification = {
  id: 'notification',
  issueId: 'issue',
  commentId: 'comment',
  actorId: 'alice',
  body: '',
  createdAt: '2026-01-01',
  readAt: null,
};
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  post.mockReset().mockResolvedValue({
    success: true,
    notifications: [notification],
    unreadCount: 1,
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('discussion notifications', () => {
  it('shows the member name without mention markup in notification text', async () => {
    const user = userEvent.setup();
    post.mockResolvedValue({
      success: true,
      notifications: [
        {
          ...notification,
          body: '[@Alice Smith](/task-mention/alice) please check this',
        },
      ],
      unreadCount: 1,
    });
    await act(async () =>
      root.render(createElement(TaskDiscussionNotifications)),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: /Notifications.*1/ })),
    );
    expect(getByRole(container, 'link').textContent).toBe(
      '@Alice Smith please check this',
    );
  });

  it('links empty notification bodies and marks read with an explicit separate action', async () => {
    const user = userEvent.setup();
    await act(async () =>
      root.render(createElement(TaskDiscussionNotifications)),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: /Notifications.*1/ })),
    );
    const link = getByRole(container, 'link', {
      name: 'Open discussion message',
    });
    expect(link.getAttribute('href')).toBe(
      'https://example.com/object/issue/issue#comment-comment',
    );
    post.mockImplementation(async (_route: string, body: { action: string }) =>
      body.action === 'readNotification'
        ? { success: true }
        : {
            success: true,
            notifications: [{ ...notification, readAt: '2026-01-02' }],
            unreadCount: 0,
          },
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Mark as read' })),
    );
    expect(post).toHaveBeenCalledWith('/s/task-manager/discussion-state', {
      action: 'readNotification',
      notificationId: 'notification',
    });
    expect(
      queryByRole(container, 'button', { name: 'Mark as read' }),
    ).toBeNull();
    expect(
      getByRole(container, 'button', { name: 'Notifications' }),
    ).toBeDefined();
  });
  it('retains the unread notification and reports failed mark-read requests', async () => {
    const user = userEvent.setup();
    await act(async () =>
      root.render(createElement(TaskDiscussionNotifications)),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: /Notifications.*1/ })),
    );
    post.mockRejectedValueOnce(new Error('Offline'));
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Mark as read' })),
    );
    expect(getByRole(container, 'alert').textContent).toBe('Offline');
    expect(
      getByRole(container, 'button', { name: 'Mark as read' }),
    ).toBeDefined();
  });
});
