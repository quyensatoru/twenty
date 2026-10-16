import { normalizeMarkdownHardBreaks } from '@/front-components/host-components/utils/normalizeMarkdownHardBreaks';

describe('normalizeMarkdownHardBreaks', () => {
  it('keeps a hard break after a bare address out of the address', () => {
    expect(
      normalizeMarkdownHardBreaks('Design: https://claude.ai/p?a=1\\\nnext'),
    ).toBe('Design: <https://claude.ai/p?a=1>\\\nnext');
  });

  it('turns a lone hard break that ends a paragraph into an empty line', () => {
    expect(normalizeMarkdownHardBreaks('so that\\\n\\\n\\\n\n## Next')).toBe(
      'so that\\\n\\\n&nbsp;\n\n## Next',
    );
    expect(normalizeMarkdownHardBreaks('\\\n\nNext')).toBe('&nbsp;\n\nNext');
  });

  it('drops a hard break with nothing after it', () => {
    expect(normalizeMarkdownHardBreaks('last word\\\n\nNext')).toBe(
      'last word\n\nNext',
    );
    expect(normalizeMarkdownHardBreaks('last word\\')).toBe('last word');
  });

  it('keeps hard breaks inside a paragraph and escaped backslashes', () => {
    expect(normalizeMarkdownHardBreaks('a\\\n\\\nb')).toBe('a\\\n\\\nb');
    expect(normalizeMarkdownHardBreaks('path C:\\\\\n\nNext')).toBe(
      'path C:\\\\\n\nNext',
    );
  });

  it('leaves fenced code untouched', () => {
    const code = '```sh\necho https://x.dev\\\n  --flag\\\n```';

    expect(normalizeMarkdownHardBreaks(code)).toBe(code);
  });
});
