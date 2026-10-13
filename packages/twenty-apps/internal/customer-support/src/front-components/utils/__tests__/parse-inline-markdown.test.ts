import { describe, expect, it } from 'vitest';

import { parseInlineMarkdown } from '../parse-inline-markdown.util';

describe('parseInlineMarkdown', () => {
  it('turns **bold** into a bold node', () => {
    expect(
      parseInlineMarkdown('If you turn **Points OFF**, the jobs stop'),
    ).toEqual([
      { type: 'text', text: 'If you turn ' },
      { type: 'bold', children: [{ type: 'text', text: 'Points OFF' }] },
      { type: 'text', text: ', the jobs stop' },
    ]);
  });

  it('reads <url>, [label](url) and bare links', () => {
    expect(
      parseInlineMarkdown(
        'See <https://a.io/x> or [the guide](https://b.io/y), also https://c.io/z.',
      ),
    ).toEqual([
      { type: 'text', text: 'See ' },
      { type: 'link', text: 'https://a.io/x', url: 'https://a.io/x' },
      { type: 'text', text: ' or ' },
      { type: 'link', text: 'the guide', url: 'https://b.io/y' },
      { type: 'text', text: ', also ' },
      { type: 'link', text: 'https://c.io/z', url: 'https://c.io/z' },
      { type: 'text', text: '.' },
    ]);
  });

  it('keeps snake_case and lone asterisks as text', () => {
    expect(parseInlineMarkdown('bloy_store_email is 5 * 3')).toEqual([
      { type: 'text', text: 'bloy_store_email is 5 * 3' },
    ]);
  });

  it('reads inline code and italics', () => {
    expect(parseInlineMarkdown('Run `npm i` *now*')).toEqual([
      { type: 'text', text: 'Run ' },
      { type: 'code', text: 'npm i' },
      { type: 'text', text: ' ' },
      { type: 'italic', children: [{ type: 'text', text: 'now' }] },
    ]);
  });
});

describe('parseInlineMarkdown images', () => {
  it('reads a pasted screenshot as an image, not a link', () => {
    expect(
      parseInlineMarkdown(
        'See ![image.png](https://storage.crisp.chat/u/image_1.png) here',
      ),
    ).toEqual([
      { type: 'text', text: 'See ' },
      {
        type: 'image',
        alt: 'image.png',
        url: 'https://storage.crisp.chat/u/image_1.png',
      },
      { type: 'text', text: ' here' },
    ]);
  });
});
