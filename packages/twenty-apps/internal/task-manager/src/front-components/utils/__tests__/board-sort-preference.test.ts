// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { post, snackbar } = vi.hoisted(() => ({
  post: vi.fn(),
  snackbar: vi.fn(),
}));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    post = post;
  },
}));
vi.mock('twenty-sdk/front-component', () => ({
  t: (text: string) => text,
  enqueueSnackbar: snackbar,
}));

import { useBoardSortPreference } from '../../hooks/use-board-sort-preference';

type HookState = ReturnType<typeof useBoardSortPreference>;

let root: Root;
let container: HTMLDivElement;
let latest: HookState;

const Probe = ({ savedSort }: { savedSort: unknown }) => {
  latest = useBoardSortPreference(savedSort);
  return null;
};

const render = (savedSort: unknown) =>
  act(async () => root.render(createElement(Probe, { savedSort })));

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  post.mockResolvedValue({ success: true, preferences: {} });
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.unstubAllGlobals();
});

const lastSavedSort = () =>
  post.mock.calls[post.mock.calls.length - 1]?.[1]?.patch?.boardSort;

describe('useBoardSortPreference', () => {
  it('lets the server pick the first order, then shows the saved one', async () => {
    await render(undefined);
    expect(latest.requestedSort).toBeNull();
    expect(latest.sort).toEqual([]);

    await render([{ field: 'priority', direction: 'desc' }]);
    expect(latest.requestedSort).toBeNull();
    expect(latest.sort).toEqual([{ field: 'priority', direction: 'desc' }]);
  });

  it('builds a multi-rule sort and saves every change', async () => {
    await render(undefined);
    await act(async () => latest.addRule());
    expect(latest.sort).toEqual([{ field: 'priority', direction: 'desc' }]);

    await act(async () => latest.addRule());
    expect(latest.sort).toEqual([
      { field: 'priority', direction: 'desc' },
      { field: 'createdAt', direction: 'desc' },
    ]);

    await act(async () => latest.toggleRuleDirection(1));
    await act(async () => latest.moveRuleUp(1));
    expect(latest.requestedSort).toEqual([
      { field: 'createdAt', direction: 'asc' },
      { field: 'priority', direction: 'desc' },
    ]);
    expect(post).toHaveBeenLastCalledWith('/s/task-manager/personal-board', {
      action: 'preferences',
      patch: { boardSort: latest.sort },
    });

    await act(async () => latest.removeRule(0));
    expect(lastSavedSort()).toEqual([{ field: 'priority', direction: 'desc' }]);
  });

  it("opens a re-picked field in that field's direction and never repeats a field", async () => {
    await render([{ field: 'priority', direction: 'desc' }]);
    await act(async () => latest.changeRuleField(0, 'dueDate'));
    expect(latest.sort).toEqual([{ field: 'dueDate', direction: 'asc' }]);

    await act(async () => latest.addRule());
    await act(async () => latest.changeRuleField(1, 'dueDate'));
    expect(latest.sort.map((rule) => rule.field)).toEqual([
      'dueDate',
      'priority',
    ]);
  });

  it('stops adding rules at the limit and clears them all', async () => {
    await render(undefined);
    for (let index = 0; index < 5; index += 1) {
      await act(async () => latest.addRule());
    }
    expect(latest.sort).toHaveLength(3);
    expect(latest.canAddRule).toBe(false);

    await act(async () => latest.clearSort());
    expect(latest.sort).toEqual([]);
    expect(lastSavedSort()).toEqual([]);
  });

  it('keeps the picked order on screen when saving it fails', async () => {
    post.mockResolvedValue({ success: false, error: 'Offline' });
    await render(undefined);
    await act(async () => latest.addRule());

    expect(latest.sort).toEqual([{ field: 'priority', direction: 'desc' }]);
    expect(snackbar).toHaveBeenCalledWith({
      message: 'Offline',
      variant: 'error',
    });
  });
});
