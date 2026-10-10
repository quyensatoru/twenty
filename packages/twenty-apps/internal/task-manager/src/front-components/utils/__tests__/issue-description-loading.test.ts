// @vitest-environment jsdom
import { getByRole, getByText, isInaccessible } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { post, record } = vi.hoisted(() => ({
  post: vi.fn(),
  record: { id: 'issue-1' as string | null },
}));
vi.mock('twenty-client-sdk/rest', () => ({
  RestApiClient: class {
    post = post;
  },
}));
vi.mock('twenty-sdk/front-component', () => ({
  t: (text: string) => text,
  useRecordId: () => record.id,
  copyToClipboard: vi.fn(),
  enqueueSnackbar: vi.fn(),
}));

import { IssueDescription } from '../../components/issue-description-panel';

let root: Root;
let container: HTMLDivElement;
let resolveDetail: (value: unknown) => void;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  record.id = 'issue-1';
  post.mockReset().mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveDetail = resolve;
      }),
  );
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const detail = {
  success: true,
  issue: { id: 'issue-1', issueKey: 'OPS-4', description: null },
  canWrite: true,
};

describe('issue description loading', () => {
  it('preserves the formatted preview and the host edit session across edit and cancel', async () => {
    const user = userEvent.setup();
    const markdown =
      '# Release\n\n| Step | Status |\n| --- | --- |\n| **Build** | *Done* |\n\n> Quoted\n\n- item\n\n```ts\nconst count = 1;\n```\n\nSee https://example.com';
    await act(async () => root.render(createElement(IssueDescription)));
    await act(async () =>
      resolveDetail({
        ...detail,
        issue: { ...detail.issue, description: { markdown } },
      }),
    );

    const editor = container.querySelector('twenty-rich-text-editor');

    expect(editor?.getAttribute('value')).toBe(markdown);
    expect(getByRole(container, 'table')).toBeDefined();
    expect(isInaccessible(editor as HTMLElement)).toBe(true);

    await act(async () =>
      user.click(getByRole(container, 'heading', { name: 'Release' })),
    );
    expect(container.querySelector('twenty-rich-text-editor')).toBe(editor);
    expect(editor?.getAttribute('value')).toBe(markdown);

    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Cancel' })),
    );
    expect(container.querySelector('twenty-rich-text-editor')).toBe(editor);
    expect(editor?.getAttribute('value')).toBe(markdown);
    expect(getByRole(container, 'table')).toBeDefined();
  });

  it('keeps links in preview and enters edit when clicking other content', async () => {
    const user = userEvent.setup();

    await act(async () => root.render(createElement(IssueDescription)));
    await act(async () =>
      resolveDetail({
        ...detail,
        issue: {
          ...detail.issue,
          description: { markdown: 'See https://example.com/details' },
        },
      }),
    );

    const link = getByRole(container, 'link', {
      name: 'https://example.com/details',
    });
    await act(async () => user.click(link));
    expect(container.textContent).not.toContain('Save');
    await act(async () => {
      link.focus();
      await user.keyboard('{Enter}');
    });
    expect(container.textContent).not.toContain('Save');
    await act(async () =>
      user.click(getByText(container, 'See', { exact: false, selector: 'p' })),
    );
    expect(getByRole(container, 'button', { name: 'Save' })).toBeDefined();
  });

  it('renders an editable description after the initial request completes', async () => {
    await act(async () => root.render(createElement(IssueDescription)));
    expect(container.textContent).not.toContain('OPS-4');
    await act(async () => resolveDetail(detail));
    expect(container.textContent).toContain('OPS-4');
    expect(
      container.querySelector('[role="button"][title="Edit"]')?.textContent,
    ).toContain('Describe the issue…');
  });

  it('can render an issue after initially having no record selected', async () => {
    record.id = null;
    await act(async () => root.render(createElement(IssueDescription)));
    expect(container.textContent).toContain('No issue selected.');
    record.id = 'issue-1';
    await act(async () => root.render(createElement(IssueDescription)));
    await act(async () => resolveDetail(detail));
    expect(container.textContent).toContain('OPS-4');
  });
});
