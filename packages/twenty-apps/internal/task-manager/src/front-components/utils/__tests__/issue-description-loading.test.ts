// @vitest-environment jsdom
import { getByRole } from '@testing-library/dom';
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
  it('opens preview links in a new tab without entering edit mode', async () => {
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

    expect(link.getAttribute('href')).toBe('https://example.com/details');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');

    await act(async () => user.click(link));
    expect(container.textContent).not.toContain('Save');

    await act(async () => {
      link.focus();
      await user.keyboard('{Enter}');
    });
    expect(container.textContent).not.toContain('Save');

    await act(async () => user.click(getByRole(container, 'paragraph')));
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
