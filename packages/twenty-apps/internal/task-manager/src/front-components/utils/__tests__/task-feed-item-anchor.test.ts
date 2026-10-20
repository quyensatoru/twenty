// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskFeedItem } from '../../components/task-feed-item';

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

  it('realigns a linked comment after content above it expands', async () => {
    vi.useFakeTimers();
    Object.defineProperties(container, {
      clientHeight: { value: 400 },
      scrollHeight: { value: 1000 },
    });
    container.getBoundingClientRect = vi.fn().mockReturnValue(
      new DOMRect(0, 0, 100, 400),
    );
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
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    if (article === null) return;
    let layoutShift = 0;
    article.getBoundingClientRect = vi.fn(
      () => new DOMRect(0, 600 + layoutShift - container.scrollTop, 100, 100),
    );

    await act(async () => vi.advanceTimersByTime(0));
    expect(container.scrollTop).toBe(520);
    layoutShift = 250;
    await act(async () => vi.advanceTimersByTime(150));
    expect(container.scrollTop).toBe(770);
    expect(article.style.outline).toBe('none');
    expect(article.querySelector('div')?.style.boxShadow).toContain('inset');
  });
});
