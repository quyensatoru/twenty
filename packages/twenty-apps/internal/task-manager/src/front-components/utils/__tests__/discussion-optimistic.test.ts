// @vitest-environment jsdom
import {
  getAllByText,
  getByRole,
  getByText,
  queryByRole,
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('twenty-sdk/front-component', () => ({
  t: (text: string) => text,
  copyToClipboard: vi.fn(),
  enqueueSnackbar: vi.fn(),
  useFrontComponentExecutionContext: (
    selector: (context: Record<string, unknown>) => unknown,
  ) => selector({}),
}));
vi.mock('../../components/task-rich-text-editor', () => ({
  TaskRichTextEditor: ({
    value,
    onChange,
    isReadOnly,
  }: {
    value: string;
    onChange?: (value: string) => void;
    isReadOnly?: boolean;
  }) =>
    isReadOnly
      ? createElement('p', {}, value)
      : createElement('textarea', {
          value,
          onChange: (event: { target: { value: string } }) =>
            onChange?.(event.target.value),
        }),
}));
import { IssueCommentList } from '../../components/issue-comment-list';
import { type DiscussionCreateInput } from '../../components/discussion-composer';
import { type IssueCommentRow } from '../../hooks/use-issue-detail';
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
const props = {
  issueId: 'issue',
  baseUrl: undefined,
  comments: [],
  membersById: new Map([
    ['viewer', { id: 'viewer', name: { firstName: 'Viewer' } }],
  ]),
  currentMemberId: 'viewer',
  highlightedCommentId: null,
  canWrite: true,
  canSoftDelete: true,
  isBusy: false,
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
};
describe('optimistic discussion submission', () => {
  it('opens a compact reaction picker and closes it after selecting an emoji', async () => {
    const user = userEvent.setup();
    const onReact = vi.fn();
    await act(async () =>
      root.render(
        createElement(IssueCommentList, {
          ...props,
          comments: [
            {
              id: 'comment',
              authorId: 'viewer',
              bodyV2: { markdown: 'Hello' },
            },
          ],
          onCreate: vi.fn(),
          onReact,
        }),
      ),
    );
    expect(queryByRole(container, 'button', { name: 'React 👍' })).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Add reaction' })),
    );
    expect(
      getByRole(container, 'menu', { name: 'Choose a reaction' }),
    ).toBeDefined();
    await act(async () =>
      user.click(
        getByRole(container, 'menuitemcheckbox', { name: 'React 👍' }),
      ),
    );
    expect(onReact).toHaveBeenCalledWith('comment', '👍', true);
    expect(queryByRole(container, 'menu')).toBeNull();
  });
  it('shows existing reaction counts and supports picker keyboard navigation', async () => {
    const user = userEvent.setup();
    const onReact = vi.fn();
    await act(async () =>
      root.render(
        createElement(IssueCommentList, {
          ...props,
          comments: [
            {
              id: 'comment',
              authorId: 'viewer',
              bodyV2: { markdown: 'Hello' },
            },
          ],
          reactions: [
            { commentId: 'comment', memberId: 'viewer', emoji: '👍' },
          ],
          onCreate: vi.fn(),
          onReact,
        }),
      ),
    );
    const chip = getByRole(container, 'button', { name: 'React 👍' });
    expect(chip.textContent).toContain('1');
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    await act(async () => user.click(chip));
    expect(onReact).toHaveBeenLastCalledWith('comment', '👍', false);
    const trigger = getByRole(container, 'button', { name: 'Add reaction' });
    await act(async () => user.click(trigger));
    await act(async () => user.keyboard('{ArrowRight}{Enter}'));
    expect(onReact).toHaveBeenLastCalledWith('comment', '❤️', true);
    expect(document.activeElement).toBe(trigger);
    await act(async () => user.click(trigger));
    await act(async () => user.keyboard('{Escape}'));
    expect(queryByRole(container, 'menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
  it('shows the comment and clears the composer while the request is still pending', async () => {
    const user = userEvent.setup();
    const create = vi.fn(
      (_input: DiscussionCreateInput) => new Promise<void>(() => undefined),
    );
    await act(async () =>
      root.render(
        createElement(IssueCommentList, { ...props, onCreate: create }),
      ),
    );
    await act(async () =>
      user.type(getByRole(container, 'textbox'), 'Hello team'),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Comment' })),
    );
    expect(getByText(container, 'Hello team', { selector: 'p' })).toBeDefined();
    expect((getByRole(container, 'textbox') as HTMLTextAreaElement).value).toBe(
      '',
    );
    await act(async () =>
      user.type(getByRole(container, 'textbox'), 'Next message'),
    );
    expect((getByRole(container, 'textbox') as HTMLTextAreaElement).value).toBe(
      'Next message',
    );
    expect(create).toHaveBeenCalledTimes(1);
  });
  it('retains failed rows and retries the same request without duplicating the comment', async () => {
    const user = userEvent.setup();
    const create = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce({
        id: 'saved',
        authorId: 'viewer',
        createdAt: '2026-10-11T12:00:00Z',
        bodyV2: { markdown: 'Keep this message' },
      });
    await act(async () =>
      root.render(
        createElement(IssueCommentList, { ...props, onCreate: create }),
      ),
    );
    await act(async () =>
      user.type(getByRole(container, 'textbox'), 'Keep this message'),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Comment' })),
    );
    expect(getByText(container, /Offline/)).toBeDefined();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Retry' })),
    );
    expect(create.mock.calls[1][0]).toEqual(create.mock.calls[0][0]);
    expect(
      getAllByText(container, 'Keep this message', { selector: 'p' }),
    ).toHaveLength(1);
  });
  it('reconciles a polled server row before the create request finishes', async () => {
    const user = userEvent.setup();
    const create = vi.fn(
      (_input: DiscussionCreateInput) =>
        new Promise<IssueCommentRow>(() => undefined),
    );
    await act(async () =>
      root.render(
        createElement(IssueCommentList, { ...props, onCreate: create }),
      ),
    );
    await act(async () =>
      user.type(getByRole(container, 'textbox'), 'Only once'),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Comment' })),
    );
    const input = create.mock.calls[0][0] as unknown as { requestId: string };
    await act(async () =>
      root.render(
        createElement(IssueCommentList, {
          ...props,
          onCreate: create,
          comments: [
            {
              id: 'saved',
              requestId: input.requestId,
              authorId: 'viewer',
              createdAt: '2026-10-11T12:00:00Z',
              bodyV2: { markdown: 'Only once' },
            },
          ],
        }),
      ),
    );
    expect(
      getAllByText(container, 'Only once', { selector: 'p' }),
    ).toHaveLength(1);
  });
});
