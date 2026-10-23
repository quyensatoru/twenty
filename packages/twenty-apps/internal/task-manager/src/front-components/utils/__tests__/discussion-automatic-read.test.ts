// @vitest-environment jsdom
import { queryByRole } from '@testing-library/dom';
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
  TaskRichTextEditor: ({ value }: { value: string }) =>
    createElement('p', {}, value),
}));
import { IssueCommentList } from '../../components/issue-comment-list';
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers();
  vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function () {
      return {
        x: 0,
        y: 100,
        top: 100,
        bottom: 200,
        left: 0,
        right: 300,
        width: 300,
        height: 100,
        toJSON: () => ({}),
      };
    },
  );
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const props = {
  issueId: 'issue',
  baseUrl: undefined,
  comments: [
    {
      id: 'comment',
      authorId: 'alice',
      createdAt: '2026-01-01T00:00:00Z',
      bodyV2: { markdown: 'Ready for review' },
    },
  ],
  membersById: new Map([
    ['alice', { id: 'alice', name: { firstName: 'Alice' } }],
    ['viewer', { id: 'viewer', name: { firstName: 'Viewer' } }],
  ]),
  currentMemberId: 'viewer',
  highlightedCommentId: null,
  canWrite: false,
  canSoftDelete: false,
  isBusy: false,
  onCreate: vi.fn().mockResolvedValue(undefined),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
};
describe('automatic discussion read receipts', () => {
  it('marks a visible message after sustained visibility without a manual button', async () => {
    const read = vi.fn().mockResolvedValue(undefined);
    await act(async () =>
      root.render(createElement(IssueCommentList, { ...props, onRead: read })),
    );
    expect(
      queryByRole(container, 'button', { name: 'Mark as read' }),
    ).toBeNull();
    await act(async () => vi.advanceTimersByTimeAsync(1500));
    expect(read).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(read).toHaveBeenCalledWith(['comment']);
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(read).toHaveBeenCalledTimes(1);
  });
  it('acknowledges messages that become due together in one call', async () => {
    const read = vi.fn().mockResolvedValue(undefined);
    const comments = [
      ...props.comments,
      {
        ...props.comments[0],
        id: 'second-comment',
        createdAt: '2026-01-01T00:01:00Z',
      },
    ];
    await act(async () =>
      root.render(
        createElement(IssueCommentList, { ...props, comments, onRead: read }),
      ),
    );
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(read).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledWith(['comment', 'second-comment']);
  });
  it('does not acknowledge offscreen or background messages', async () => {
    const read = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    await act(async () =>
      root.render(createElement(IssueCommentList, { ...props, onRead: read })),
    );
    await act(async () => vi.advanceTimersByTimeAsync(4000));
    expect(read).not.toHaveBeenCalled();
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 1500,
      top: 1500,
      bottom: 1600,
      left: 0,
      right: 300,
      width: 300,
      height: 100,
      toJSON: () => ({}),
    });
    await act(async () => vi.advanceTimersByTimeAsync(4000));
    expect(read).not.toHaveBeenCalled();
  });
  it('restarts the dwell timer after leaving the visible area', async () => {
    const read = vi.fn().mockResolvedValue(undefined);
    await act(async () =>
      root.render(createElement(IssueCommentList, { ...props, onRead: read })),
    );
    await act(async () => vi.advanceTimersByTimeAsync(1500));
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    await act(async () => vi.advanceTimersByTimeAsync(500));
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    await act(async () => vi.advanceTimersByTimeAsync(1500));
    expect(read).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(read).toHaveBeenCalledTimes(1);
  });
  it('retries failed acknowledgements after a backoff and another visibility dwell', async () => {
    const read = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue(undefined);
    await act(async () =>
      root.render(createElement(IssueCommentList, { ...props, onRead: read })),
    );
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(read).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(9000));
    expect(read).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(3500));
    expect(read).toHaveBeenCalledTimes(2);
  });
  it('uses viewport coordinates when the widget root has scrolled above the screen', async () => {
    const read = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const top = this === document.documentElement ? -800 : 100;
        return {
          x: 0,
          y: top,
          top,
          bottom: top + 100,
          left: 0,
          right: 300,
          width: 300,
          height: 100,
          toJSON: () => ({}),
        };
      },
    );
    await act(async () =>
      root.render(createElement(IssueCommentList, { ...props, onRead: read })),
    );
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(read).toHaveBeenCalledWith(['comment']);
  });
  it('a receipt for a different newer comment does not mark this comment read', async () => {
    const read = vi.fn().mockResolvedValue(undefined);
    await act(async () =>
      root.render(
        createElement(IssueCommentList, {
          ...props,
          onRead: read,
          readStates: [
            {
              memberId: 'viewer',
              commentId: 'different-comment',
              lastReadAt: '2026-01-02T00:00:00Z',
            },
          ],
        }),
      ),
    );
    expect(container.textContent).not.toContain('Read by Viewer');
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(read).toHaveBeenCalledWith(['comment']);
  });
  it('shows a confirmed read-by receipt without sending again', async () => {
    const read = vi.fn().mockResolvedValue(undefined);
    await act(async () =>
      root.render(
        createElement(IssueCommentList, {
          ...props,
          onRead: read,
          readStates: [
            {
              memberId: 'viewer',
              commentId: 'comment',
              lastReadAt: '2026-01-01T00:00:00Z',
            },
          ],
        }),
      ),
    );
    await act(async () => vi.advanceTimersByTimeAsync(4000));
    expect(read).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Read by Viewer');
  });
});
