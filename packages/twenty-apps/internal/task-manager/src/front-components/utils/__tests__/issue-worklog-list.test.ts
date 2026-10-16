// @vitest-environment jsdom
import { getByRole, getByText, queryByRole } from '@testing-library/dom';
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
  TaskRichTextEditor: ({ value }: { value: string }) =>
    createElement('p', {}, value),
}));
import { IssueWorklogList } from '../../components/issue-worklog-list';

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
  worklogs: [
    {
      id: 'worklog',
      memberId: 'viewer',
      timeSpentMinutes: 150,
      startedAt: '2026-10-16T08:00:00.000Z',
      description: '',
    },
  ],
  membersById: new Map([
    ['viewer', { id: 'viewer', name: { firstName: 'Viewer' } }],
  ]),
  currentMemberId: 'viewer',
  highlightedWorklogId: null,
  canWrite: false,
  canSoftDelete: true,
  totalMinutes: 240,
  originalEstimateMinutes: 360,
  isBusy: false,
  onCreate: vi.fn(),
  onUpdateDescription: vi.fn(),
  onDelete: vi.fn(),
  sortIsNewestFirst: true,
};

describe('worklog list', () => {
  it('states logged time against the estimate above the entries', async () => {
    await act(async () => root.render(createElement(IssueWorklogList, props)));

    expect(getByText(container, /logged of 6h estimate/)).toBeDefined();
    expect(
      getByRole(container, 'progressbar').getAttribute('aria-valuenow'),
    ).toBe('67');
    expect(getByText(container, 'No description')).toBeDefined();
  });

  it('keeps delete behind the menu, asking twice', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    await act(async () =>
      root.render(createElement(IssueWorklogList, { ...props, onDelete })),
    );

    expect(
      queryByRole(container, 'button', { name: 'More actions' }),
    ).toBeNull();
    await act(async () => user.hover(getByText(container, 'No description')));
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'More actions' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'menuitem', { name: 'Delete worklog' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'menuitem', { name: 'Confirm delete?' })),
    );

    expect(onDelete).toHaveBeenCalledWith('worklog');
  });
});
