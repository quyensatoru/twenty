// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskFeedItem } from '../../components/task-feed-item';

let root: Root;
let container: HTMLDivElement;
let scrollIntoView: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // jsdom has no scrollIntoView; the sandbox provides it.
  scrollIntoView = vi.fn();
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
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

describe('feed deep links', () => {
  it.each(['comment-comment-1', 'worklog-worklog-1'])(
    'focuses the targeted %s when it appears',
    async (anchorId) => {
      const render = (isHighlighted: boolean) =>
        createElement(
          TaskFeedItem,
          { anchorId, isHighlighted, authorName: 'Alex' },
          'Target entry',
        );

      await act(async () => root.render(render(false)));
      expect(document.activeElement).not.toBe(container.querySelector('article'));

      await act(async () => root.render(render(true)));
      expect(document.activeElement).toBe(container.querySelector('article'));
      expect(container.querySelector('article')?.id).toBe(anchorId);
    },
  );

  it('asks the host to bring a linked entry into view again as content above it loads', async () => {
    vi.useFakeTimers();
    await act(async () =>
      root.render(
        createElement(
          TaskFeedItem,
          {
            anchorId: 'comment-linked',
            isHighlighted: true,
            authorName: 'Alex',
          },
          'Linked comment',
        ),
      ),
    );

    await act(async () => vi.advanceTimersByTime(0));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
    await act(async () => vi.advanceTimersByTime(900));
    expect(scrollIntoView).toHaveBeenCalledTimes(3);
    const article = container.querySelector('article');
    expect(article?.style.outline).toBe('none');
    expect(article?.querySelector('div')?.style.boxShadow).toContain('inset');
  });
});
