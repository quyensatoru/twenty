import { describe, expect, it } from 'vitest';

import { buildUploadFileName } from '../build-upload-file-name.util';
import { replaceMarkdownLinkUrl } from '../replace-markdown-link-url.util';

describe('buildUploadFileName', () => {
  it('takes the last path segment', () => {
    expect(buildUploadFileName('https://example.com/a/b/logo.png')).toBe(
      'logo.png',
    );
  });

  it('drops the query string and the fragment', () => {
    expect(
      buildUploadFileName('https://example.com/logo.png?v=2&x=1#top'),
    ).toBe('logo.png');
  });

  it('decodes an escaped segment', () => {
    expect(buildUploadFileName('https://example.com/my%20logo.png')).toBe(
      'my logo.png',
    );
  });

  it('keeps a half-escaped segment rather than throwing', () => {
    expect(buildUploadFileName('https://example.com/100%.png')).toBe('100%.png');
  });

  it('returns an empty name for a URL with no path', () => {
    expect(buildUploadFileName('https://example.com')).toBe('example.com');
    expect(buildUploadFileName('https://example.com/')).toBe('example.com');
  });
});

describe('replaceMarkdownLinkUrl', () => {
  it('swaps the link target and reports the caret after it', () => {
    const result = replaceMarkdownLinkUrl(
      'before ![logo.png](https://a/logo.png) after',
      'https://a/logo.png',
      'https://twenty/file/x',
    );

    expect(result?.value).toBe(
      'before ![logo.png](https://twenty/file/x) after',
    );
    expect(result?.value.slice(0, result.caretPosition)).toBe(
      'before ![logo.png](https://twenty/file/x)',
    );
  });

  it('leaves text the author has since edited untouched', () => {
    expect(
      replaceMarkdownLinkUrl('the link is gone', 'https://a/logo.png', 'x'),
    ).toBeNull();
  });

  it('swaps only the first occurrence', () => {
    const result = replaceMarkdownLinkUrl(
      '![a](https://a/l.png) ![b](https://a/l.png)',
      'https://a/l.png',
      'https://twenty/1',
    );

    expect(result?.value).toBe('![a](https://twenty/1) ![b](https://a/l.png)');
  });

  it('does not match a bare URL that is not a markdown target', () => {
    expect(
      replaceMarkdownLinkUrl('https://a/l.png', 'https://a/l.png', 'x'),
    ).toBeNull();
  });
});
