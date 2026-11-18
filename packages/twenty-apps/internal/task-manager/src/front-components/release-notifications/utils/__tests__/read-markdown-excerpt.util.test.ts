import { describe, expect, it } from 'vitest';

import { readMarkdownExcerpt } from '../read-markdown-excerpt.util';

describe('readMarkdownExcerpt', () => {
  it('drops markdown syntax and keeps link text', () => {
    expect(
      readMarkdownExcerpt(
        '## Heatmap filters\n\n- **Faster** loading\n- See [the guide](https://example.com)',
      ),
    ).toBe('Heatmap filters Faster loading See the guide');
  });

  it('truncates long text with an ellipsis', () => {
    expect(readMarkdownExcerpt('a'.repeat(30), 10)).toBe(`${'a'.repeat(9)}…`);
  });
});
