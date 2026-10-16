// @vitest-environment jsdom
import {
  getAllByRole,
  getAllByText,
  getByRole,
  getByText,
  queryByRole,
  queryByText,
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('twenty-sdk/front-component', () => ({
  t: (text: string, values?: Record<string, unknown>) =>
    text.replace(/\{(\w+)\}/g, (_, key: string) => String(values?.[key])),
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
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
import { copyToClipboard } from 'twenty-sdk/front-component';

import { IssueCommentList } from '../../components/issue-comment-list';
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

const comment = (
  id: string,
  authorId: string,
  createdAt: string,
  markdown: string,
  parentCommentId?: string,
): IssueCommentRow => ({
  id,
  authorId,
  createdAt,
  parentCommentId: parentCommentId ?? null,
  bodyV2: { markdown },
});

const props = {
  issueId: 'issue',
  baseUrl: 'https://crm.example.com',
  comments: [] as IssueCommentRow[],
  membersById: new Map([
    ['viewer', { id: 'viewer', name: { firstName: 'Viewer' } }],
    ['alice', { id: 'alice', name: { firstName: 'Alice' } }],
    ['bob', { id: 'bob', name: { firstName: 'Bob' } }],
  ]),
  currentMemberId: 'viewer',
  highlightedCommentId: null,
  canWrite: true,
  canSoftDelete: true,
  isBusy: false,
  onCreate: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
};

const THREAD = [
  comment('root', 'viewer', '2026-10-16T08:00:00.000Z', 'Root comment'),
  comment(
    'reply-1',
    'alice',
    '2026-10-16T09:00:00.000Z',
    'First reply',
    'root',
  ),
  comment('reply-2', 'bob', '2026-10-16T10:00:00.000Z', 'Second reply', 'root'),
  comment(
    'reply-3',
    'alice',
    '2026-10-16T11:00:00.000Z',
    'Third reply',
    'root',
  ),
];

describe('discussion threads', () => {
  it('folds a long thread to its first reply until it is opened', async () => {
    const user = userEvent.setup();
    await act(async () =>
      root.render(
        createElement(IssueCommentList, { ...props, comments: THREAD }),
      ),
    );

    expect(getByText(container, 'First reply')).toBeDefined();
    expect(queryByText(container, 'Second reply')).toBeNull();

    await act(async () =>
      user.click(getByRole(container, 'button', { name: /2 more replies/ })),
    );

    expect(getByText(container, 'Second reply')).toBeDefined();
    expect(getByText(container, 'Third reply')).toBeDefined();
  });

  it('answers a reply in the same thread', async () => {
    const user = userEvent.setup();
    const create = vi.fn(() => new Promise<void>(() => undefined));
    await act(async () =>
      root.render(
        createElement(IssueCommentList, {
          ...props,
          comments: THREAD.slice(0, 2),
          onCreate: create,
        }),
      ),
    );

    // The second Reply belongs to the reply, not the root.
    await act(async () =>
      user.click(getAllByRole(container, 'button', { name: 'Reply' })[1]),
    );
    const replyBox = getAllByRole(container, 'textbox')[1];
    await act(async () => user.type(replyBox, 'Agreed'));
    const sendButtons = getAllByRole(container, 'button', { name: 'Reply' });
    await act(async () => user.click(sendButtons[sendButtons.length - 1]));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ markdown: 'Agreed', parentCommentId: 'root' }),
    );
  });

  it('keeps copy link and a confirmed delete behind the more menu', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    await act(async () =>
      root.render(
        createElement(IssueCommentList, {
          ...props,
          comments: THREAD.slice(0, 1),
          onDelete,
        }),
      ),
    );

    // Edit and the menu wait for the pointer, so a resting thread reads clean.
    expect(
      queryByRole(container, 'button', { name: 'More actions' }),
    ).toBeNull();
    expect(queryByRole(container, 'button', { name: 'Edit' })).toBeNull();
    await act(async () => user.hover(getByText(container, 'Root comment')));
    expect(getByRole(container, 'button', { name: 'Edit' })).toBeDefined();

    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'More actions' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'menuitem', { name: 'Copy link' })),
    );
    expect(copyToClipboard).toHaveBeenCalledWith(
      'https://crm.example.com/object/issue/issue#comment-root',
    );

    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'More actions' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'menuitem', { name: 'Delete comment' })),
    );
    expect(onDelete).not.toHaveBeenCalled();
    await act(async () =>
      user.click(getByRole(container, 'menuitem', { name: 'Confirm delete?' })),
    );
    expect(onDelete).toHaveBeenCalledWith('root');
  });

  it('only offers delete on your own comments', async () => {
    const user = userEvent.setup();
    await act(async () =>
      root.render(
        createElement(IssueCommentList, {
          ...props,
          comments: [THREAD[1]],
        }),
      ),
    );

    await act(async () => user.hover(getByText(container, 'First reply')));
    expect(queryByRole(container, 'button', { name: 'Edit' })).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'More actions' })),
    );
    expect(
      getByRole(container, 'menuitem', { name: 'Copy link' }),
    ).toBeDefined();
    expect(queryByText(container, 'Delete comment')).toBeNull();
  });

  it('names the author once for messages sent moments apart', async () => {
    await act(async () =>
      root.render(
        createElement(IssueCommentList, {
          ...props,
          comments: [
            comment('one', 'alice', '2026-10-16T08:00:00.000Z', 'Hello'),
            comment('two', 'alice', '2026-10-16T08:02:00.000Z', 'Again'),
            comment('three', 'alice', '2026-10-16T09:00:00.000Z', 'Later'),
          ],
        }),
      ),
    );

    expect(getByText(container, 'Again')).toBeDefined();
    expect(getAllByText(container, 'Alice')).toHaveLength(2);
  });
});
