import { describe, expect, it } from 'vitest';

import { collectMarkdownImages } from '../collect-markdown-images.util';

describe('collectMarkdownImages', () => {
  it('finds an image that is a block of its own', () => {
    expect(
      collectMarkdownImages('![shot](https://x.test/a.png)'),
    ).toEqual([{ alt: 'shot', url: 'https://x.test/a.png' }]);
  });

  it('finds an image sitting inside a line of text', () => {
    expect(
      collectMarkdownImages('before ![shot](https://x.test/a.png) after'),
    ).toEqual([{ alt: 'shot', url: 'https://x.test/a.png' }]);
  });

  it('finds images inside list items and quotes', () => {
    expect(
      collectMarkdownImages(
        '- ![one](https://x.test/1.png)\n> ![two](https://x.test/2.png)',
      ),
    ).toEqual([
      { alt: 'one', url: 'https://x.test/1.png' },
      { alt: 'two', url: 'https://x.test/2.png' },
    ]);
  });

  it('keeps each picture once', () => {
    expect(
      collectMarkdownImages(
        '![a](https://x.test/a.png)\n\n![a again](https://x.test/a.png)',
      ),
    ).toEqual([{ alt: 'a', url: 'https://x.test/a.png' }]);
  });

  it('ignores plain links and code', () => {
    expect(
      collectMarkdownImages(
        '[doc](https://x.test/a.png)\n\n```\n![no](https://x.test/b.png)\n```',
      ),
    ).toEqual([]);
  });

  it('returns nothing for text without pictures', () => {
    expect(collectMarkdownImages('## Heading\n\nplain')).toEqual([]);
  });
});
