// @vitest-environment jsdom
import { getByRole, queryByRole, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type TaskTodayData } from '../../../types/task-today';

const runtime = vi.hoisted(() => ({
  post: vi.fn(),
  isMobile: false,
}));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    post = runtime.post;
  },
}));
vi.mock('twenty-sdk/front-component', () => ({
  t: (text: string, values: Record<string, unknown> = {}) =>
    text.replace(/\{(\w+)\}/g, (_, key: string) =>
      String(values[key] ?? `{${key}}`),
    ),
}));
vi.mock('../../hooks/use-is-mobile', () => ({
  useIsMobile: () => runtime.isMobile,
}));
vi.mock('../../utils/read-record-page-base-url.util', () => ({
  readRecordPageBaseUrl: () => 'https://crm.example.com',
}));

import { TaskToday } from '../../components/task-today';

let root: Root;
let container: HTMLDivElement;
let data: TaskTodayData;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  runtime.isMobile = false;
  localStorage.clear();
  data = {
    success: true,
    day: '2026-10-12',
    section: 'overdue',
    hasMember: true,
    counts: {
      overdue: 1,
      today: 0,
      upcoming: 0,
      inProgress: 0,
      noDueDate: 0,
      recentlyDone: 0,
    },
    issues: [
      {
        id: 'issue',
        issueKey: 'APP-1',
        title: 'Fix checkout',
        statusId: 'todo',
        projectId: 'project',
        dueDate: '2026-10-11',
      },
    ],
    projects: [{ id: 'project', name: 'Checkout', canWrite: true }],
    issueStatuses: [
      {
        id: 'todo',
        name: 'To do',
        category: 'UNSTARTED',
        projectId: 'project',
      },
      { id: 'done', name: 'Done', category: 'DONE', projectId: 'project' },
    ],
    notifications: [
      {
        id: 'notification',
        issueId: 'issue',
        commentId: 'comment',
        body: '[@Alice](/task-mention/alice) please check',
        createdAt: '2026-10-12T00:00:00Z',
      },
    ],
    unreadCount: 1,
    hasNextPage: false,
    endCursor: null,
  };
  runtime.post
    .mockReset()
    .mockImplementation(async (_path: string, body: { section?: string }) => ({
      ...data,
      section: body.section ?? data.section,
    }));
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const render = () => act(async () => root.render(createElement(TaskToday)));

const openDisplayMenu = async (user: ReturnType<typeof userEvent.setup>) =>
  act(async () =>
    user.click(getByRole(container, 'button', { name: 'Display options' })),
  );
const pickDisplayItem = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  await openDisplayMenu(user);
  await act(async () =>
    user.click(getByRole(document.body, /^Show as/.test(name) ? 'menuitemradio' : 'menuitem', { name })),
  );
};

describe('Today dashboard', () => {
  it('shows every queue as a tab with its count and says what needs attention', async () => {
    await render();
    const tabs = getByRole(container, 'tablist', { name: 'Work filters' });
    expect(within(tabs).getAllByRole('tab')).toHaveLength(6);
    expect(tabs.textContent).toContain('Overdue');
    expect(tabs.textContent).toContain('Due today');
    expect(tabs.textContent).toContain('Next 7 days');
    expect(
      getByRole(container, 'heading', { name: '1 issue needs you today' }),
    ).toBeDefined();
    expect(queryByRole(container, 'button', { name: 'Room view' })).toBeNull();
  });

  it('opens on the most pressing queue that holds work', async () => {
    data.counts = { ...data.counts, overdue: 0, noDueDate: 1 };
    await render();
    expect(runtime.post).toHaveBeenLastCalledWith(
      '/s/task-manager/today',
      expect.objectContaining({ section: 'noDueDate' }),
    );
    expect(
      getByRole(container, 'tab', { name: /No due date/ }).getAttribute(
        'aria-selected',
      ),
    ).toBe('true');
  });

  it('opens the cards for a legacy Room preference', async () => {
    const user = userEvent.setup();
    Object.assign(data, {
      memberId: 'me',
      boardPreferences: {
        workView: 'board',
        density: 'compact',
        effectsEnabled: false,
      },
    });
    await render();
    expect(getByRole(container, 'link', { name: 'Fix checkout' })).toBeTruthy();
    await openDisplayMenu(user);
    expect(
      getByRole(document.body, 'menuitemradio', {
        name: 'Show as cards',
      }).getAttribute('aria-checked'),
    ).toBe('true');
    expect(
      runtime.post.mock.calls.every(([path]) =>
        String(path).endsWith('/today'),
      ),
    ).toBe(true);
  });

  it('keeps the selected work view while loading and replaces placeholders with tasks', async () => {
    let resolveWork: (value: TaskTodayData) => void = () => {
      throw new Error('Work request has not started');
    };
    runtime.post.mockImplementationOnce(
      () =>
        new Promise<TaskTodayData>((resolve) => {
          resolveWork = resolve;
        }),
    );
    const user = userEvent.setup();
    await render();
    expect(
      getByRole(container, 'status', { name: 'Loading your work' }),
    ).toBeTruthy();
    expect(queryByRole(container, 'link', { name: 'Fix checkout' })).toBeNull();
    await pickDisplayItem(user, 'Show as cards');
    expect(
      getByRole(container, 'status', { name: 'Loading your work' }),
    ).toBeTruthy();
    expect(runtime.post).toHaveBeenCalledTimes(1);
    await act(async () => resolveWork(data));
    expect(
      queryByRole(container, 'status', { name: 'Loading your work' }),
    ).toBeNull();
    expect(getByRole(container, 'link', { name: 'Fix checkout' })).toBeTruthy();
    expect(
      getByRole(container, 'button', { name: 'Peek at: APP-1' }),
    ).toBeTruthy();
  });

  it('starts with effects off and remembers turning them on', async () => {
    const user = userEvent.setup();
    await render();
    await pickDisplayItem(user, 'Turn effects on');
    expect(localStorage.getItem('task-today.motion')).toBe('on');
    await openDisplayMenu(user);
    expect(
      getByRole(document.body, 'menuitem', { name: 'Turn effects off' }),
    ).toBeDefined();
  });

  it('restores the saved effects preference when opening the dashboard', async () => {
    const user = userEvent.setup();
    localStorage.setItem('task-today.motion', 'on');
    await render();
    await openDisplayMenu(user);
    expect(
      getByRole(document.body, 'menuitem', { name: 'Turn effects off' }),
    ).toBeDefined();
  });

  it('shuffles a visible task into the focus session without changing its status', async () => {
    const user = userEvent.setup();
    await render();
    await pickDisplayItem(user, 'Shuffle a task into focus');
    expect(
      getByRole(container, 'region', { name: 'Focus session' }).textContent,
    ).toContain('Fix checkout');
    expect(runtime.post).toHaveBeenCalledTimes(1);
  });

  it('enters focus mode and restores the full dashboard on exit', async () => {
    const user = userEvent.setup();
    await render();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Focus mode' })),
    );
    expect(
      queryByRole(container, 'heading', { name: '1 issue needs you today' }),
    ).toBeNull();
    expect(queryByRole(container, 'region', { name: 'Your inbox' })).toBeNull();
    expect(getByRole(container, 'region', { name: 'My work' })).toBeDefined();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Exit focus mode' })),
    );
    expect(
      getByRole(container, 'heading', { name: '1 issue needs you today' }),
    ).toBeDefined();
  });

  it('brings the selected task into focus mode on mobile', async () => {
    runtime.isMobile = true;
    const user = userEvent.setup();
    await render();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Focus on: APP-1' })),
    );
    expect(
      getByRole(container, 'button', { name: 'Exit focus mode' }),
    ).toBeDefined();
    expect(
      getByRole(container, 'region', { name: 'Focus session' }).textContent,
    ).toContain('Fix checkout');
  });

  it('runs, pauses, resumes and resets a focus session against elapsed time', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await render();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: '5m' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Start' })),
    );
    await act(async () => vi.advanceTimersByTime(61000));
    expect(
      getByRole(container, 'timer', { name: 'Time remaining' }).textContent,
    ).toBe('03:59');
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Pause' })),
    );
    await act(async () => vi.advanceTimersByTime(30000));
    expect(
      getByRole(container, 'timer', { name: 'Time remaining' }).textContent,
    ).toBe('03:59');
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Resume' })),
    );
    await act(async () => vi.advanceTimersByTime(1000));
    expect(
      getByRole(container, 'timer', { name: 'Time remaining' }).textContent,
    ).toBe('03:58');
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Reset session' })),
    );
    expect(
      getByRole(container, 'timer', { name: 'Time remaining' }).textContent,
    ).toBe('05:00');
  });

  it('celebrates a finished session once and leaves task status unchanged', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await render();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: '5m' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Start' })),
    );
    await act(async () => vi.advanceTimersByTime(300000));
    expect(
      getByRole(container, 'timer', { name: 'Time remaining' }).textContent,
    ).toBe('00:00');
    expect(getByRole(container, 'status').textContent).toContain(
      'Focus session complete.',
    );
    expect(runtime.post).toHaveBeenCalledTimes(1);
  });

  it('celebrates quick completion only after the guarded update succeeds', async () => {
    const user = userEvent.setup();
    await render();
    runtime.post.mockRejectedValueOnce(new Error('Could not save'));
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Mark done: APP-1' })),
    );
    expect(getByRole(container, 'alert').textContent).toContain(
      'Could not save',
    );
    expect(queryByRole(container, 'status')).toBeNull();
    runtime.post.mockImplementation(async (path: string) =>
      path === '/s/task-manager/update-issue' ? { success: true } : data,
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Mark done: APP-1' })),
    );
    expect(runtime.post).toHaveBeenCalledWith('/s/task-manager/update-issue', {
      issueId: 'issue',
      data: { statusId: 'done' },
    });
    expect(getByRole(container, 'status').textContent).toContain(
      'One task down.',
    );
  });

  it('turns a card over to read its brief and returns to the actionable face', async () => {
    const user = userEvent.setup();
    data.issues[0].description = {
      markdown: 'Review the checkout redirect before release.',
    };
    await render();
    await pickDisplayItem(user, 'Show as cards');
    expect(
      queryByRole(container, 'heading', { name: 'Task brief' }),
    ).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Peek at: APP-1' })),
    );
    expect(
      getByRole(container, 'heading', { name: 'Task brief' }),
    ).toBeDefined();
    expect(container.textContent).toContain(
      'Review the checkout redirect before release.',
    );
    expect(
      queryByRole(container, 'button', { name: 'Complete: APP-1' }),
    ).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Turn back: APP-1' })),
    );
    expect(
      getByRole(container, 'button', { name: 'Complete: APP-1' }),
    ).toBeDefined();
    expect(runtime.post).toHaveBeenCalledTimes(1);
  });

  it('keeps keyboard navigation on the visible face of a flipped card', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await render();
    await pickDisplayItem(user, 'Show as cards');
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Peek at: APP-1' })),
    );
    await act(async () => vi.advanceTimersByTime(620));
    expect(document.activeElement).toBe(
      getByRole(container, 'button', { name: 'Turn back: APP-1' }),
    );
    await act(async () => user.tab());
    expect(document.activeElement).toBe(
      getByRole(container, 'link', { name: 'Open task' }),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Turn back: APP-1' })),
    );
    await act(async () => vi.advanceTimersByTime(620));
    expect(document.activeElement).toBe(
      getByRole(container, 'button', { name: 'Peek at: APP-1' }),
    );
  });

  it('switches between the list and cards without changing the work queue', async () => {
    const user = userEvent.setup();
    await render();
    expect(
      getByRole(container, 'button', { name: 'Change status: APP-1' }),
    ).toBeDefined();
    await pickDisplayItem(user, 'Show as cards');
    expect(
      getByRole(container, 'button', { name: 'Peek at: APP-1' }),
    ).toBeDefined();
    expect(getByRole(container, 'link', { name: 'Fix checkout' })).toBeDefined();
    expect(runtime.post).toHaveBeenCalledTimes(1);
  });

  it('finishes the departure animation after saving before reloading the work queue', async () => {
    vi.useFakeTimers();
    localStorage.setItem('task-today.motion', 'on');
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await render();
    runtime.post.mockImplementation(async (path: string) => {
      if (path === '/s/task-manager/update-issue') {
        data = { ...data, issues: [], counts: { ...data.counts, overdue: 0 } };
        return { success: true };
      }
      return data;
    });
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Mark done: APP-1' })),
    );
    expect(
      runtime.post.mock.calls.filter(
        ([path]) => path === '/s/task-manager/today',
      ),
    ).toHaveLength(1);
    await act(async () => vi.advanceTimersByTime(480));
    expect(queryByRole(container, 'link', { name: 'Fix checkout' })).toBeNull();
    expect(getByRole(container, 'status').textContent).toContain(
      'One task down.',
    );
    expect(
      runtime.post.mock.calls.filter(
        ([path]) => path === '/s/task-manager/today',
      ),
    ).toHaveLength(2);
  });

  it('opens work and discussion messages with the correct deep links', async () => {
    await render();
    expect(
      getByRole(container, 'link', { name: /Fix checkout/ }).getAttribute(
        'href',
      ),
    ).toBe('https://crm.example.com/object/issue/issue');
    expect(
      getByRole(container, 'link', {
        name: '@Alice please check',
      }).getAttribute('href'),
    ).toBe('https://crm.example.com/object/issue/issue#comment-comment');
    expect(
      getByRole(container, 'button', { name: 'Change status: APP-1' }),
    ).toBeDefined();
  });

  it('switches queues and displays a helpful empty state', async () => {
    const user = userEvent.setup();
    await render();
    data.issues = [];
    const tabs = within(
      getByRole(container, 'tablist', { name: 'Work filters' }),
    );
    await act(async () =>
      user.click(tabs.getByRole('tab', { name: /Due today/ })),
    );
    expect(
      getByRole(container, 'region', { name: 'Due today' }).textContent,
    ).toContain('Nothing is due today.');
    expect(queryByRole(container, 'link', { name: /Fix checkout/ })).toBeNull();
    expect(runtime.post).toHaveBeenLastCalledWith(
      '/s/task-manager/today',
      expect.objectContaining({
        section: 'today',
        day: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    );
  });

  it('loads more without losing existing issues or duplicating rows', async () => {
    const user = userEvent.setup();
    data.hasNextPage = true;
    data.endCursor = 'cursor';
    await render();
    data = {
      ...data,
      issues: [...data.issues, { id: 'second', title: 'Review release' }],
      hasNextPage: false,
    };
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Load more' })),
    );
    expect(getByRole(container, 'link', { name: /Fix checkout/ })).toBeDefined();
    expect(
      getByRole(container, 'link', { name: /Review release/ }),
    ).toBeDefined();
    expect(queryByRole(container, 'button', { name: 'Load more' })).toBeNull();
    expect(runtime.post).toHaveBeenLastCalledWith(
      '/s/task-manager/today',
      expect.objectContaining({ after: 'cursor' }),
    );
  });

  it('updates status through the existing guarded route and reloads counts', async () => {
    const user = userEvent.setup();
    await render();
    runtime.post.mockImplementation(async (path: string) => {
      if (path === '/s/task-manager/update-issue') {
        data = { ...data, issues: [], counts: { ...data.counts, overdue: 0 } };
        return { success: true };
      }
      return data;
    });
    await act(async () =>
      user.click(
        getByRole(container, 'button', { name: 'Change status: APP-1' }),
      ),
    );
    await act(async () =>
      user.click(getByRole(document.body, 'menuitemradio', { name: 'Done' })),
    );
    expect(runtime.post).toHaveBeenCalledWith('/s/task-manager/update-issue', {
      issueId: 'issue',
      data: { statusId: 'done' },
    });
    expect(queryByRole(container, 'link', { name: /Fix checkout/ })).toBeNull();
    expect(
      getByRole(container, 'region', { name: 'Overdue' }).textContent,
    ).toContain('No overdue work.');
  });

  it('retains unread messages and shows errors if marking read fails', async () => {
    const user = userEvent.setup();
    await render();
    runtime.post.mockRejectedValueOnce(new Error('Offline'));
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Mark as read' })),
    );
    expect(getByRole(container, 'alert').textContent).toContain('Offline');
    expect(
      getByRole(container, 'link', { name: '@Alice please check' }),
    ).toBeDefined();
    expect(
      getByRole(container, 'button', { name: 'Mark as read' }),
    ).toBeDefined();
  });

  it('refreshes the inbox after successfully marking a message read', async () => {
    const user = userEvent.setup();
    await render();
    runtime.post.mockImplementation(async (path: string) => {
      if (path === '/s/task-manager/discussion-state') {
        data = { ...data, notifications: [], unreadCount: 0 };
        return { success: true };
      }
      return data;
    });
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Mark as read' })),
    );
    expect(
      getByRole(container, 'region', { name: 'Your inbox' }).textContent,
    ).toContain('You’re all caught up.');
    expect(runtime.post).toHaveBeenCalledWith(
      '/s/task-manager/discussion-state',
      { action: 'readNotification', notificationId: 'notification' },
    );
  });

  it('hides editing for read-only projects and keeps editing available on mobile', async () => {
    data.projects[0].canWrite = false;
    await render();
    expect(
      queryByRole(container, 'button', { name: 'Change status: APP-1' }),
    ).toBeNull();
    data.projects[0].canWrite = true;
    runtime.isMobile = true;
    const user = userEvent.setup();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: /^Refresh/ })),
    );
    expect(
      getByRole(container, 'button', { name: 'Change status: APP-1' }),
    ).toBeDefined();
  });

  it('offers retry when the initial request fails, without claiming the queues are empty', async () => {
    const user = userEvent.setup();
    runtime.post.mockRejectedValueOnce(new Error('Server unavailable'));
    await render();
    expect(getByRole(container, 'alert').textContent).toContain(
      'Server unavailable',
    );
    expect(container.textContent).not.toContain('No overdue work.');
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Retry' })),
    );
    expect(
      getByRole(container, 'link', { name: /Fix checkout/ }),
    ).toBeDefined();
    expect(queryByRole(container, 'alert')).toBeNull();
  });
});
