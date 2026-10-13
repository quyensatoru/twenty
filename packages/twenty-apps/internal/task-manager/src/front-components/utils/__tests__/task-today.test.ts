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

describe('Today dashboard', () => {
  it('offers only Cards and List while retaining deadline radar', async () => {
    await render();
    const views = getByRole(container, 'group', { name: 'Work view' });
    expect(within(views).getAllByRole('button')).toHaveLength(2);
    expect(getByRole(views, 'button', { name: 'Card view' })).toBeTruthy();
    expect(getByRole(views, 'button', { name: 'List view' })).toBeTruthy();
    expect(queryByRole(container, 'button', { name: 'Room view' })).toBeNull();
    expect(
      queryByRole(container, 'region', { name: 'Personal workspace' }),
    ).toBeNull();
    const radar = getByRole(container, 'region', { name: 'Task radar' });
    expect(radar.textContent).toContain('Overdue');
    expect(radar.textContent).toContain('Due today');
    expect(radar.textContent).toContain('Next 7 days');
  });
  it('opens the normal task view for a legacy Room preference', async () => {
    Object.assign(data, {
      memberId: 'me',
      boardPreferences: {
        workView: 'board',
        density: 'compact',
        effectsEnabled: false,
      },
    });
    await render();
    expect(
      getByRole(container, 'button', { name: 'Card view' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true');
    expect(getByRole(container, 'link', { name: 'Fix checkout' })).toBeTruthy();
    expect(queryByRole(container, 'button', { name: 'Room view' })).toBeNull();
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
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'List view' })),
    );
    expect(
      getByRole(container, 'button', { name: 'List view' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true');
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
      getByRole(container, 'button', { name: 'List view' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true');
  });

  it('lets people pause decorative motion and remembers their preference', async () => {
    const user = userEvent.setup();
    await render();
    const toggle = getByRole(container, 'button', {
      name: 'Toggle visual effects',
    });
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    await act(async () => user.click(toggle));
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem('task-today.motion')).toBe('off');
  });

  it('restores the saved effects preference when opening the dashboard', async () => {
    localStorage.setItem('task-today.motion', 'off');
    await render();
    const toggle = getByRole(container, 'button', {
      name: 'Toggle visual effects',
    }) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.disabled).toBe(false);
  });

  it('shuffles a visible task into the focus session without changing its status', async () => {
    const user = userEvent.setup();
    await render();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Shuffle a task' })),
    );
    expect(
      getByRole(container, 'region', { name: 'Focus session' }).textContent,
    ).toContain('Fix checkout');
    expect(
      getByRole(container, 'button', { name: 'Focus on: APP-1' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true');
    expect(runtime.post).toHaveBeenCalledTimes(1);
  });

  it('enters focus mode and restores the full dashboard on exit', async () => {
    const user = userEvent.setup();
    await render();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Focus mode' })),
    );
    expect(
      queryByRole(container, 'heading', { name: 'A fresh start, every day.' }),
    ).toBeNull();
    expect(
      queryByRole(container, 'complementary', { name: 'Your inbox' }),
    ).toBeNull();
    expect(getByRole(container, 'region', { name: 'My work' })).toBeDefined();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Exit focus mode' })),
    );
    expect(
      getByRole(container, 'heading', { name: 'A fresh start, every day.' }),
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
      user.click(getByRole(container, 'button', { name: '5 min' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Start session' })),
    );
    await act(async () => vi.advanceTimersByTime(61000));
    expect(
      getByRole(container, 'timer', { name: 'Time remaining' }).textContent,
    ).toBe('03:59');
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Pause session' })),
    );
    await act(async () => vi.advanceTimersByTime(30000));
    expect(
      getByRole(container, 'timer', { name: 'Time remaining' }).textContent,
    ).toBe('03:59');
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Resume session' })),
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
      user.click(getByRole(container, 'button', { name: '5 min' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Start session' })),
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
    localStorage.setItem('task-today.motion', 'off');
    const user = userEvent.setup();
    await render();
    runtime.post.mockRejectedValueOnce(new Error('Could not save'));
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Complete: APP-1' })),
    );
    expect(getByRole(container, 'alert').textContent).toContain(
      'Could not save',
    );
    expect(queryByRole(container, 'status')).toBeNull();
    runtime.post.mockImplementation(async (path: string) =>
      path === '/s/task-manager/update-issue' ? { success: true } : data,
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Complete: APP-1' })),
    );
    expect(runtime.post).toHaveBeenCalledWith('/s/task-manager/update-issue', {
      issueId: 'issue',
      data: { statusId: 'done' },
    });
    expect(getByRole(container, 'status').textContent).toContain(
      'One task down.',
    );
  });

  it('turns a task over to read its brief and returns to the actionable face', async () => {
    const user = userEvent.setup();
    data.issues[0].description = {
      markdown: 'Review the checkout redirect before release.',
    };
    await render();
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

  it('keeps keyboard navigation on the visible face of a flipped task', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await render();
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

  it('switches between the desk and list without changing the work queue', async () => {
    const user = userEvent.setup();
    await render();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'List view' })),
    );
    expect(
      getByRole(container, 'button', { name: 'List view' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true');
    expect(
      getByRole(container, 'link', { name: 'Fix checkout' }),
    ).toBeDefined();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Card view' })),
    );
    expect(
      getByRole(container, 'button', { name: 'Card view' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true');
    expect(runtime.post).toHaveBeenCalledTimes(1);
  });

  it('finishes the departure animation after saving before reloading the work queue', async () => {
    vi.useFakeTimers();
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
      user.click(getByRole(container, 'button', { name: 'Complete: APP-1' })),
    );
    expect(getByRole(container, 'status').textContent).toContain('Saving');
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
      getByRole(container, 'link', { name: 'Fix checkout' }).getAttribute(
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
    const filters = within(
      getByRole(container, 'group', { name: 'Work filters' }),
    );
    await act(async () =>
      user.click(filters.getByRole('button', { name: /^Due today/ })),
    );
    expect(
      getByRole(container, 'region', { name: 'Due today' }).textContent,
    ).toContain('Nothing is due today.');
    expect(queryByRole(container, 'link', { name: 'Fix checkout' })).toBeNull();
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
    expect(
      getByRole(container, 'link', { name: 'Fix checkout' }),
    ).toBeDefined();
    expect(
      getByRole(container, 'link', { name: 'Review release' }),
    ).toBeDefined();
    expect(queryByRole(container, 'button', { name: 'Load more' })).toBeNull();
    expect(runtime.post).toHaveBeenLastCalledWith(
      '/s/task-manager/today',
      expect.objectContaining({ after: 'cursor' }),
    );
  });

  it('updates status through the existing guarded route and reloads counts', async () => {
    localStorage.setItem('task-today.motion', 'off');
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
      user.click(getByRole(container, 'option', { name: 'Done' })),
    );
    expect(runtime.post).toHaveBeenCalledWith('/s/task-manager/update-issue', {
      issueId: 'issue',
      data: { statusId: 'done' },
    });
    expect(queryByRole(container, 'link', { name: 'Fix checkout' })).toBeNull();
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
      getByRole(container, 'complementary', { name: 'Your inbox' }).textContent,
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
      getByRole(container, 'link', { name: 'Fix checkout' }),
    ).toBeDefined();
    expect(queryByRole(container, 'alert')).toBeNull();
  });
});
