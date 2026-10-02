import { describe, expect, it } from 'vitest';

import { markdownToBlocknote } from '../markdown-to-blocknote.util';
import { parseMarkdownBlocks } from '../parse-markdown-blocks.util';
import {
  isImageUrl,
  parseMarkdownInline,
} from '../parse-markdown-inline.util';
import { buildRichTextValue } from '../read-rich-text-plain-value.util';

describe('parseMarkdownInline', () => {
  it('reads bold, italic and inline code runs', () => {
    expect(parseMarkdownInline('a **b** c *d* e `f`')).toEqual([
      { type: 'text', text: 'a ', styles: expect.objectContaining({ isBold: false }) },
      { type: 'text', text: 'b', styles: { isBold: true, isItalic: false, isCode: false } },
      { type: 'text', text: ' c ', styles: expect.anything() },
      { type: 'text', text: 'd', styles: { isBold: false, isItalic: true, isCode: false } },
      { type: 'text', text: ' e ', styles: expect.anything() },
      { type: 'text', text: 'f', styles: { isBold: false, isItalic: false, isCode: true } },
    ]);
  });

  it('prefers an image over a link', () => {
    expect(parseMarkdownInline('![shot](https://x.test/a.png)')).toEqual([
      { type: 'image', alt: 'shot', url: 'https://x.test/a.png' },
    ]);
  });

  it('turns a bare url into a link', () => {
    expect(parseMarkdownInline('see https://x.test/page')).toEqual([
      { type: 'text', text: 'see ', styles: expect.anything() },
      { type: 'link', text: 'https://x.test/page', url: 'https://x.test/page' },
    ]);
  });

  it('does not read emphasis inside a code span', () => {
    expect(parseMarkdownInline('`a * b`')).toEqual([
      { type: 'text', text: 'a * b', styles: { isBold: false, isItalic: false, isCode: true } },
    ]);
  });
});

describe('isImageUrl', () => {
  it('recognises image extensions with and without a query', () => {
    expect(isImageUrl('https://x.test/a.PNG')).toBe(true);
    expect(isImageUrl('https://x.test/a.jpg?v=2')).toBe(true);
    expect(isImageUrl('https://x.test/a.pdf')).toBe(false);
  });
});

describe('parseMarkdownBlocks', () => {
  it('splits headings, lists, quotes and paragraphs', () => {
    const blocks = parseMarkdownBlocks(
      '# Title\n\nfirst\n\n- one\n- two\n\n1. step\n\n> quoted\n\n---',
    );

    expect(blocks.map((block) => block.type)).toEqual([
      'heading',
      'paragraph',
      'bulletListItem',
      'bulletListItem',
      'numberedListItem',
      'quote',
      'divider',
    ]);
  });

  it('keeps a fenced code block verbatim', () => {
    const blocks = parseMarkdownBlocks('```ts\nconst a = 1;\n\nconst b = 2;\n```');

    expect(blocks).toEqual([
      { type: 'codeBlock', code: 'const a = 1;\n\nconst b = 2;', language: 'ts' },
    ]);
  });

  it('lifts a standalone image out of a paragraph', () => {
    expect(parseMarkdownBlocks('![a](https://x.test/a.png)')).toEqual([
      { type: 'image', alt: 'a', url: 'https://x.test/a.png' },
    ]);
  });

  it('returns nothing for blank input', () => {
    expect(parseMarkdownBlocks('   \n\n  ')).toEqual([]);
  });
});

describe('markdownToBlocknote', () => {
  it('keeps the blocknote half in sync with the markdown half', () => {
    const blocknote = markdownToBlocknote('# Hi\n\n- **bold** item');

    expect(JSON.parse(blocknote ?? '[]')).toEqual([
      {
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: 'Hi', styles: {} }],
      },
      {
        type: 'bulletListItem',
        content: [
          { type: 'text', text: 'bold', styles: { bold: true } },
          { type: 'text', text: ' item', styles: {} },
        ],
      },
    ]);
  });

  it('writes a link as blocknote link content', () => {
    expect(JSON.parse(markdownToBlocknote('[a](https://x.test)') ?? '[]')).toEqual([
      {
        type: 'paragraph',
        content: [
          {
            type: 'link',
            href: 'https://x.test',
            content: [{ type: 'text', text: 'a', styles: {} }],
          },
        ],
      },
    ]);
  });

  it('has nothing to write for an empty body', () => {
    expect(markdownToBlocknote('  ')).toBeNull();
  });
});

describe('buildRichTextValue', () => {
  it('stores markdown and the derived blocknote document together', () => {
    const value = buildRichTextValue('hello');

    expect(value.markdown).toBe('hello');
    expect(JSON.parse(value.blocknote ?? '[]')).toEqual([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'hello', styles: {} }],
      },
    ]);
  });
});
