import { describe, expect, it } from 'vitest';

import { renderInlineMarkup } from '../render-inline-markup.util';

describe('renderInlineMarkup', () => {
  it('renders bold, italic, links and line breaks', () => {
    expect(renderInlineMarkup('**a** *b* [c](https://x.io)\nd', '#00f')).toBe(
      '<strong>a</strong> <em>b</em> <a href="https://x.io" style="color:#00f;text-decoration:underline;">c</a><br />d',
    );
  });

  it('escapes author HTML', () => {
    expect(renderInlineMarkup('<script>alert(1)</script>', '#00f')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('neutralises javascript links', () => {
    expect(renderInlineMarkup('[x](javascript:alert(1))', '#00f')).toContain(
      'href="#"',
    );
  });
});
