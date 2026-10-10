// @vitest-environment jsdom
import { getByRole, getByText } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskRichTextPreview } from '../../components/task-rich-text-preview';

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

const renderPreview = async (value: string, onMouseDown = vi.fn()) => {
  await act(async () =>
    root.render(
      createElement(
        'div',
        { onMouseDown },
        createElement(TaskRichTextPreview, { value }),
      ),
    ),
  );
};

describe('rich text preview', () => {
  it('preserves visible formatting even when host styles reset HTML defaults', async () => {
    await renderPreview(
      '# Release\n\n| Step | Status |\n| --- | --- |\n| **Build** | *Done* |\n\n> Quoted\n\n1. item\n\n- [x] checked\n\n~~removed~~\n\n```ts\nconst count = 1;\n```',
    );
    expect(
      getByRole(container, 'heading', { level: 1 }).style.fontSize,
    ).not.toBe('');
    expect(getByRole(container, 'table').style.borderCollapse).toBe('collapse');
    expect(
      getByRole(container, 'cell', { name: 'Build' }).style.border,
    ).not.toBe('');
    expect(getByText(container, 'Build').style.fontWeight).toBe('bold');
    expect(getByText(container, 'Done').style.fontStyle).toBe('italic');
    expect(getByText(container, 'removed').style.textDecoration).toBe(
      'line-through',
    );
    expect(
      getByText(container, 'item').closest('ol')?.style.listStyleType,
    ).toBe('decimal');
    expect(getByRole(container, 'checkbox').hasAttribute('checked')).toBe(true);
    expect(
      getByText(container, 'const count = 1;').closest('pre'),
    ).not.toBeNull();
  });

  it('preserves embedded HTML tables and inline formatting safely', async () => {
    await renderPreview(
      '<table><tbody><tr><td colspan="2"><strong>HTML cell</strong></td></tr></tbody></table>\n\n<u>Underlined</u> and <span style="color: red; position: fixed">Colored</span>\n\n<script>alert(1)</script>',
    );
    expect(
      getByRole(container, 'cell', { name: 'HTML cell' }).getAttribute(
        'colspan',
      ),
    ).toBe('2');
    expect(getByText(container, 'Underlined').style.textDecoration).toBe(
      'underline',
    );
    expect(getByText(container, 'Colored').style.color).toBe('red');
    expect(getByText(container, 'Colored').style.position).toBe('');
    expect(container.querySelector('script')).toBeNull();
  });

  it.each([
    ['https://example.com/a_b_c', 'https://example.com/a_b_c'],
    [
      'https://example.com/merge\\_requests/1836',
      'https://example.com/merge_requests/1836',
    ],
    [
      '(https://example.com/path?first=1&second=2#details),',
      'https://example.com/path?first=1&second=2#details',
    ],
    ['www.example.com.', 'https://www.example.com'],
    ['**https://example.com/path**', 'https://example.com/path'],
    ['*https://example.com/path*', 'https://example.com/path'],
    ['__https://example.com/path__', 'https://example.com/path'],
    ['_https://example.com/path_', 'https://example.com/path'],
    ['https://example.com/a_(b)', 'https://example.com/a_(b)'],
    [
      'https://sbc-gitlab.bsscommerce.com/sae-division/tc-team/shopify-app-loyalty/shopify-app-loyalty-api/-/merge_requests/1836',
      'https://sbc-gitlab.bsscommerce.com/sae-division/tc-team/shopify-app-loyalty/shopify-app-loyalty-api/-/merge_requests/1836',
    ],
  ])(
    'links %s with its original destination',
    async (markdown, destination) => {
      await renderPreview(markdown);
      expect(getByRole(container, 'link').getAttribute('href')).toBe(
        destination,
      );
    },
  );

  it('links URLs in nested HTML without injecting literal Markdown', async () => {
    await renderPreview('<div><div>Nested text</div>https://example.com</div>');
    expect(getByRole(container, 'link').getAttribute('href')).toBe(
      'https://example.com',
    );
    expect(container.textContent).toBe('Nested texthttps://example.com');
  });

  it('preserves existing links, images and code without nesting generated links', async () => {
    await renderPreview(
      '[website](https://example.com) ![image](https://example.com/image.png) [reference][site]\n\n[site]: https://example.com/ref\n\n`https://example.com/code`\n\n```sh\ncurl https://example.com/fenced\n```',
    );
    expect(
      getByRole(container, 'link', { name: 'website' }).getAttribute('href'),
    ).toBe('https://example.com');
    expect(
      getByRole(container, 'link', { name: 'reference' }).getAttribute('href'),
    ).toBe('https://example.com/ref');
    expect(getByRole(container, 'img').getAttribute('src')).toBe(
      'https://example.com/image.png',
    );
    expect(container.querySelectorAll('a')).toHaveLength(2);
    expect(container.querySelector('a a')).toBeNull();
  });

  it('stops link events while ordinary content still enters edit', async () => {
    const user = userEvent.setup();
    const startEditing = vi.fn();
    await renderPreview(
      'Ordinary text\n\nhttps://example.com/path ripcurl-id.myshopify.com\n\n<table><tr><td>https://example.com/table</td></tr></table>',
      startEditing,
    );
    for (const label of [
      'https://example.com/path',
      'ripcurl-id.myshopify.com',
      'https://example.com/table',
    ]) {
      const link = getByRole(container, 'link', { name: label });
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      await act(async () => user.click(link));
    }
    expect(startEditing).not.toHaveBeenCalled();
    await act(async () => user.click(getByText(container, 'Ordinary text')));
    expect(startEditing).toHaveBeenCalledOnce();
  });
});
