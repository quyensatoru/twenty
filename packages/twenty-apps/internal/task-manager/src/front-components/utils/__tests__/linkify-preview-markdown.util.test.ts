import { describe, expect, it } from 'vitest';

import { linkifyPreviewMarkdown } from '../linkify-preview-markdown.util';

describe('linkifyPreviewMarkdown', () => {
  it('links the URLs in the task description example', () => {
    const apiUrl =
      'https://sbc-gitlab.bsscommerce.com/sae-division/tc-team/shopify-app-loyalty/shopify-app-loyalty-api/-/merge_requests/1836';

    expect(
      linkifyPreviewMarkdown(
        `api: ${apiUrl}\nnpm run console -- reset:programMembers ripcurl-id.myshopify.com confirm`,
      ),
    ).toBe(
      `api: [${apiUrl.replace('_', '\\_')}](${apiUrl})\nnpm run console -- reset:programMembers [ripcurl-id.myshopify.com](https://ripcurl-id.myshopify.com) confirm`,
    );
  });

  it('keeps punctuation outside links and preserves query strings and fragments', () => {
    expect(
      linkifyPreviewMarkdown(
        'See (https://example.com/path?first=1&second=2#details), then www.example.com.',
      ),
    ).toBe(
      'See ([https://example.com/path?first=1&second=2#details](https://example.com/path?first=1&second=2#details)), then [www.example.com](https://www.example.com).',
    );
  });

  it('escapes parentheses and underscores in generated Markdown', () => {
    expect(linkifyPreviewMarkdown('https://example.com/a_(b)')).toBe(
      '[https://example.com/a\\_(b)](https://example.com/a_%28b%29)',
    );
  });

  it('uses the original URL when the editor escaped Markdown punctuation', () => {
    expect(
      linkifyPreviewMarkdown('https://example.com/merge\\_requests/1836'),
    ).toBe(
      '[https://example.com/merge\\_requests/1836](https://example.com/merge_requests/1836)',
    );
  });

  it('keeps existing links, images, autolinks and reference links intact', () => {
    const markdown =
      '[website](https://example.com/a_(b)) ![image](https://example.com/image.png) <https://example.com> [example.com][site]\n[site]: https://example.com';

    expect(linkifyPreviewMarkdown(markdown)).toBe(markdown);
    expect(linkifyPreviewMarkdown(linkifyPreviewMarkdown('example.com'))).toBe(
      '[example.com](https://example.com)',
    );
  });

  it('keeps inline and fenced code intact while linking surrounding prose', () => {
    const markdown =
      'Before example.com\n```sh\ncurl https://example.com\n```\n`https://example.com` and ``example.com `code` ``\n~~~\nexample.com\n~~~\nAfter example.com';

    expect(linkifyPreviewMarkdown(markdown)).toBe(
      'Before [example.com](https://example.com)\n```sh\ncurl https://example.com\n```\n`https://example.com` and ``example.com `code` ``\n~~~\nexample.com\n~~~\nAfter [example.com](https://example.com)',
    );
  });

  it('keeps unclosed fenced code and indented code intact', () => {
    const markdown = '    https://example.com\n```\nexample.com';

    expect(linkifyPreviewMarkdown(markdown)).toBe(markdown);
  });

  it('links URLs within emphasis, lists and tables without changing their formatting', () => {
    expect(
      linkifyPreviewMarkdown(
        '**example.com**\n- https://example.com\n| Site | example.com |',
      ),
    ).toBe(
      '**[example.com](https://example.com)**\n- [https://example.com](https://example.com)\n| Site | [example.com](https://example.com) |',
    );
  });

  it.each(['**', '__', '*', '_'])(
    'preserves %s emphasis around URLs with paths',
    (marker) => {
      expect(
        linkifyPreviewMarkdown(
          `${marker}See https://example.com/path${marker}`,
        ),
      ).toBe(
        `${marker}See [https://example.com/path](https://example.com/path)${marker}`,
      );
    },
  );

  it('preserves underscores within URL paths', () => {
    expect(linkifyPreviewMarkdown('https://example.com/a_b_c')).toBe(
      '[https://example.com/a\\_b\\_c](https://example.com/a_b_c)',
    );
  });

  it('does not link email addresses or unsafe protocols', () => {
    const markdown =
      'dev@example.com javascript:alert(1) data:text/plain,hello ftp://example.com';

    expect(linkifyPreviewMarkdown(markdown)).toBe(markdown);
  });

  it('preserves empty text and line endings', () => {
    expect(linkifyPreviewMarkdown('')).toBe('');
    expect(linkifyPreviewMarkdown('hello\r\nworld')).toBe('hello\r\nworld');
  });
});
