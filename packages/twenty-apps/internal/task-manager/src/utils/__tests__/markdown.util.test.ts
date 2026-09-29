import { describe, expect, it } from 'vitest';

import {
  applyMarkdownFormat,
  buildMarkdownForUrl,
} from '../apply-markdown-format.util';
import { deriveCaretPosition } from '../derive-caret-position.util';
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

describe('applyMarkdownFormat', () => {
  it('wraps the selected range', () => {
    expect(
      applyMarkdownFormat({
        value: 'hello world',
        selectionStart: 6,
        selectionEnd: 11,
        format: 'bold',
        placeholder: 'bold text',
      }),
    ).toEqual({ value: 'hello **world**', selectionStart: 8, selectionEnd: 13 });
  });

  it('unwraps markers that sit just outside the range', () => {
    expect(
      applyMarkdownFormat({
        value: 'hello **world**',
        selectionStart: 8,
        selectionEnd: 13,
        format: 'bold',
        placeholder: 'bold text',
      }),
    ).toEqual({ value: 'hello world', selectionStart: 6, selectionEnd: 11 });
  });

  it('unwraps a range that is already wrapped', () => {
    expect(
      applyMarkdownFormat({
        value: 'hello **world**',
        selectionStart: 6,
        selectionEnd: 15,
        format: 'bold',
        placeholder: 'bold text',
      }).value,
    ).toBe('hello world');
  });

  it('inserts a placeholder when nothing is selected', () => {
    expect(
      applyMarkdownFormat({
        value: 'hello ',
        selectionStart: 6,
        selectionEnd: 6,
        format: 'italic',
        placeholder: 'italic text',
      }).value,
    ).toBe('hello *italic text*');
  });

  it('prefixes every selected line and numbers an ordered list', () => {
    expect(
      applyMarkdownFormat({
        value: 'one\ntwo\nthree',
        selectionStart: 0,
        selectionEnd: 13,
        format: 'numberedList',
        placeholder: 'List item',
      }).value,
    ).toBe('1. one\n2. two\n3. three');
  });

  it('removes a line prefix that every selected line already has', () => {
    expect(
      applyMarkdownFormat({
        value: '- one\n- two',
        selectionStart: 0,
        selectionEnd: 11,
        format: 'bulletList',
        placeholder: 'List item',
      }).value,
    ).toBe('one\ntwo');
  });

  it('builds a link around the selection', () => {
    expect(
      applyMarkdownFormat({
        value: 'read docs',
        selectionStart: 5,
        selectionEnd: 9,
        format: 'link',
        placeholder: 'link text',
        linkUrl: 'https://x.test',
      }).value,
    ).toBe('read [docs](https://x.test)');
  });

  it('fences the selection as a code block on its own line', () => {
    expect(
      applyMarkdownFormat({
        value: 'a\nb',
        selectionStart: 2,
        selectionEnd: 3,
        format: 'codeBlock',
        placeholder: 'code',
      }).value,
    ).toBe('a\n```\nb\n```\n');
  });

  it('clamps a selection that runs past the value', () => {
    expect(
      applyMarkdownFormat({
        value: 'abc',
        selectionStart: 99,
        selectionEnd: 120,
        format: 'bold',
        placeholder: 'bold text',
      }).value,
    ).toBe('abc**bold text**');
  });
});

describe('buildMarkdownForUrl', () => {
  it('writes an image for an image url and a link otherwise', () => {
    expect(buildMarkdownForUrl('https://x.test/shot.png', true)).toBe(
      '![shot.png](https://x.test/shot.png)',
    );
    expect(buildMarkdownForUrl('https://x.test/spec.pdf', false)).toBe(
      '[spec.pdf](https://x.test/spec.pdf)',
    );
  });
});

describe('deriveCaretPosition', () => {
  it('lands after text typed in the middle', () => {
    expect(deriveCaretPosition('hello world', 'hello big world')).toBe(10);
  });

  it('lands where a character was deleted', () => {
    expect(deriveCaretPosition('hello world', 'hell world')).toBe(4);
  });

  it('lands at the end when text is appended', () => {
    expect(deriveCaretPosition('hello', 'hello world')).toBe(11);
  });

  it('lands at the end of a pasted run', () => {
    expect(deriveCaretPosition('', 'https://x.test')).toBe(14);
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
