// @vitest-environment jsdom
import { fireEvent, getByRole, queryByRole } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const runtime = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    get = runtime.get;
  },
}));
vi.mock('twenty-sdk/front-component', () => ({ t: (text: string) => text }));
vi.mock('../post-app-route.util', () => ({ postAppRoute: runtime.post }));
vi.mock('../../components/task-rich-text-preview', () => ({
  TaskRichTextPreview: ({ value }: { value: string }) =>
    createElement('div', {}, value),
}));
import { IssueAiActivityTab } from '../../components/issue-ai-activity-tab';
import { IssueAiPanel } from '../../components/issue-ai-panel';
let root: Root;
let container: HTMLDivElement;
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  runtime.post.mockReset();
  runtime.get
    .mockReset()
    .mockResolvedValue({ aiModels: [{ modelId: 'available-model' }] });
  runtime.post.mockImplementation(
    async (_path: string, body: { action?: string }) =>
      body.action === 'initialize'
        ? { success: true, repositories: [{ id: 'repo-a', slug: 'org/repo' }] }
        : {
            success: true,
            answer: 'Inspect src/example.ts:1',
            sha: 'a'.repeat(40),
            repository: 'org/repo',
          },
  );
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root.render(createElement(IssueAiPanel, { issueId: 'issue-a' })),
  );
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
describe('private task AI panel', () => {
  it('submits with Enter and preserves Shift+Enter as a newline', async () => {
    const user = userEvent.setup();
    const input = getByRole(container, 'textbox', {
      name: 'Ask about this task',
    });
    await act(async () => user.type(input, 'First line'));
    await act(async () => user.keyboard('{Shift>}{Enter}{/Shift}'));
    await act(async () => user.type(input, 'Second line'));
    expect((input as HTMLTextAreaElement).value).toBe(
      'First line\nSecond line',
    );
    expect(
      runtime.post.mock.calls.filter(([, body]) => body.action === 'send'),
    ).toHaveLength(0);
    await act(async () => user.keyboard('{Enter}'));
    expect(runtime.post).toHaveBeenCalledWith(expect.any(String), {
      action: 'send',
      issueId: 'issue-a',
      message: 'First line\nSecond line',
    });
  });
  it('does not submit empty or composing input with Enter', async () => {
    const user = userEvent.setup();
    const input = getByRole(container, 'textbox', {
      name: 'Ask about this task',
    });
    await act(async () => user.click(input));
    await act(async () => user.keyboard('{Enter}'));
    await act(async () => user.type(input, 'Draft'));
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    });
    expect(
      runtime.post.mock.calls.filter(([, body]) => body.action === 'send'),
    ).toHaveLength(0);
  });
  it('opens a new conversation when no run has been recorded yet', async () => {
    runtime.post.mockResolvedValue({
      success: true,
      repositories: [],
      history: [],
      run: null,
    });
    await act(async () =>
      root.render(
        createElement(IssueAiPanel, { issueId: 'new-issue', key: 'new' }),
      ),
    );
    expect(queryByRole(container, 'alert')).toBeNull();
    expect(
      getByRole(container, 'textbox', { name: 'Ask about this task' }),
    ).toBeDefined();
  });
  it('restores completed short steps and the active step from the event journal', async () => {
    runtime.post.mockResolvedValue({
      success: true,
      repositories: [],
      history: [],
      run: {
        runId: 'active',
        status: 'running',
        operation: 'Analyzing task',
        question: 'Question',
        updatedAt: Date.now(),
        events: [
          {
            sequence: 1,
            stepId: 1,
            operation: 'Preparing context',
            status: 'running',
            timestamp: 1000,
          },
          {
            sequence: 2,
            stepId: 1,
            operation: 'Preparing context',
            status: 'completed',
            timestamp: 1250,
          },
          {
            sequence: 3,
            stepId: 2,
            operation: 'Analyzing task',
            status: 'running',
            timestamp: 1300,
          },
        ],
      },
    });
    await act(async () =>
      root.render(
        createElement(IssueAiPanel, { issueId: 'issue-a', key: 'events' }),
      ),
    );
    const timeline = getByRole(container, 'list', { name: 'AI activity' });
    expect(timeline.textContent).toContain('Preparing context');
    expect(timeline.textContent).toContain('0.3s');
    expect(timeline.textContent).toContain('Analyzing task');
    expect(timeline.textContent).toContain('In progress');
  });
  it('offers prompts without sending and includes all project repositories automatically', async () => {
    const user = userEvent.setup();
    expect(
      queryByRole(container, 'button', { name: 'Start conversation' }),
    ).toBeNull();
    expect(container.textContent).toContain('Source: all project repositories');
    expect(container.textContent).toContain('org/repo');
    expect(queryByRole(container, 'combobox')).toBeNull();
    await act(async () =>
      user.click(
        getByRole(container, 'button', { name: 'Summarize this task' }),
      ),
    );
    expect(
      (
        getByRole(container, 'textbox', {
          name: 'Ask about this task',
        }) as HTMLTextAreaElement
      ).value,
    ).toContain('Summarize');
    const input = getByRole(container, 'textbox', {
      name: 'Ask about this task',
    }) as HTMLTextAreaElement;
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(input.value.length);
    expect(runtime.post.mock.calls).toHaveLength(1);
  });
  it('can select the same suggestion again after editing its text', async () => {
    const user = userEvent.setup();
    const prompt = getByRole(container, 'button', {
      name: 'Summarize this task',
    });
    await act(async () => user.click(prompt));
    const input = getByRole(container, 'textbox', {
      name: 'Ask about this task',
    });
    await act(async () => user.type(input, ' with details'));
    await act(async () => user.click(prompt));
    expect(
      (
        getByRole(container, 'textbox', {
          name: 'Ask about this task',
        }) as HTMLTextAreaElement
      ).value,
    ).toBe('Summarize this task');
  });
  it('keeps a pending question and conversation when switching tabs', async () => {
    const user = userEvent.setup();
    await act(async () =>
      root.render(
        createElement(IssueAiActivityTab, {
          issueId: 'issue-a',
          isActive: true,
        }),
      ),
    );
    runtime.post.mockImplementation(
      (_path: string, body: { action?: string }) =>
        body.action === 'send'
          ? new Promise(() => undefined)
          : Promise.resolve({
              success: true,
              run: { status: 'running', operation: 'Preparing advice' },
            }),
    );
    await act(async () =>
      user.type(
        getByRole(container, 'textbox', { name: 'Ask about this task' }),
        'Pending question',
      ),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Ask AI' })),
    );
    expect(container.textContent).toContain('Pending question');
    const requestsBeforeSwitch = runtime.post.mock.calls.length;
    await act(async () =>
      root.render(
        createElement(IssueAiActivityTab, {
          issueId: 'issue-a',
          isActive: false,
        }),
      ),
    );
    await act(async () =>
      root.render(
        createElement(IssueAiActivityTab, {
          issueId: 'issue-a',
          isActive: true,
        }),
      ),
    );
    expect(container.textContent).toContain('Pending question');
    expect(
      queryByRole(container, 'button', { name: 'Start conversation' }),
    ).toBeNull();
    expect(
      getByRole(container, 'button', { name: 'Cancel reply' }),
    ).toBeDefined();
    expect(runtime.post.mock.calls.length).toBe(requestsBeforeSwitch);
  });
  it('explains missing AI setup before a user submits a question', async () => {
    runtime.get.mockResolvedValue({ aiModels: [] });
    const user = userEvent.setup();
    await act(async () =>
      root.render(
        createElement(IssueAiPanel, { issueId: 'issue-a', key: 'reopened' }),
      ),
    );
    expect(getByRole(container, 'status').textContent).toContain(
      'AI is not configured',
    );
    await act(async () =>
      user.type(
        getByRole(container, 'textbox', { name: 'Ask about this task' }),
        'Help',
      ),
    );
    expect(
      (getByRole(container, 'button', { name: 'Ask AI' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('restores private replies when a conversation is reopened', async () => {
    runtime.post.mockResolvedValue({
      success: true,
      repositories: [],
      history: [
        {
          question: 'Prior question',
          answer: 'Prior private reply',
          sha: '',
          repository: '',
        },
      ],
    });
    await act(async () =>
      root.render(
        createElement(IssueAiPanel, { issueId: 'issue-a', key: 'reopened' }),
      ),
    );
    expect(container.textContent).toContain('Prior private reply');
    expect(
      getByRole(container, 'button', { name: 'Preview comment' }),
    ).toBeTruthy();
    expect(
      getByRole(container, 'textbox', { name: 'Ask about this task' }),
    ).toBeTruthy();
  });

  it('automatically restores the question and progress of an active run', async () => {
    runtime.post.mockResolvedValue({
      success: true,
      repositories: [],
      history: [],
      run: {
        status: 'running',
        operation: 'Inspecting file',
        question: 'Restored pending question',
        updatedAt: Date.now(),
      },
    });
    await act(async () =>
      root.render(
        createElement(IssueAiPanel, { issueId: 'issue-a', key: 'restored' }),
      ),
    );
    expect(container.textContent).toContain('Restored pending question');
    expect(getByRole(container, 'status').textContent).toBe('Inspecting file');
    expect(
      getByRole(container, 'button', { name: 'Cancel reply' }),
    ).toBeDefined();
  });
  it('requires a separate preview and explicit share before posting a comment', async () => {
    const user = userEvent.setup();
    await act(async () =>
      root.render(
        createElement(IssueAiPanel, { issueId: 'issue-a', key: 'reopened' }),
      ),
    );
    await act(async () => {
      await user.type(
        getByRole(container, 'textbox', { name: 'Ask about this task' }),
        'How do I implement this?',
      );
    });
    await act(async () => {
      await user.click(getByRole(container, 'button', { name: 'Ask AI' }));
    });
    expect(
      runtime.post.mock.calls.filter(
        (call) => call[1]?.action !== 'initialize',
      ),
    ).toHaveLength(1);
    expect(queryByRole(container, 'dialog')).toBeNull();
    await act(async () => {
      await user.click(
        getByRole(container, 'button', { name: 'Preview comment' }),
      );
    });
    expect(
      getByRole(container, 'dialog', { name: 'Preview AI comment' }),
    ).toBeTruthy();
    expect(
      runtime.post.mock.calls.filter(
        (call) => call[1]?.action !== 'initialize',
      ),
    ).toHaveLength(1);
    await act(async () => {
      await user.click(
        getByRole(container, 'button', { name: 'Share as comment' }),
      );
    });
    expect(
      runtime.post.mock.calls.find((call) => call[1]?.bodyV2)?.[1],
    ).toMatchObject({
      issueId: 'issue-a',
      bodyV2: { markdown: expect.stringContaining('Commit: aaaa') },
    });
    expect(
      runtime.post.mock.calls.find((call) => call[1]?.bodyV2)?.[1].bodyV2
        .markdown,
    ).toContain('AI-assisted');
    expect(getByRole(container, 'status').textContent).toBe(
      'Answer shared as a comment.',
    );
  });
  it('retains a question after an AI failure', async () => {
    const user = userEvent.setup();
    await act(async () =>
      root.render(
        createElement(IssueAiPanel, { issueId: 'issue-a', key: 'reopened' }),
      ),
    );
    runtime.post.mockRejectedValue(new Error('Reconnect your repository'));
    await act(async () => {
      await user.type(
        getByRole(container, 'textbox', { name: 'Ask about this task' }),
        'Find the bug',
      );
    });
    await act(async () => {
      await user.click(getByRole(container, 'button', { name: 'Ask AI' }));
    });
    expect(
      (
        getByRole(container, 'textbox', {
          name: 'Ask about this task',
        }) as HTMLTextAreaElement
      ).value,
    ).toBe('Find the bug');
    expect(getByRole(container, 'alert').textContent).toContain('Reconnect');
  });
});
