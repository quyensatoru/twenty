import { describe, expect, it } from 'vitest';

import {
  resolveSignedMarkdown,
  stripFileTokens,
} from '../resolve-signed-markdown.util';

const fileId = 'a722e7a0-cc5d-4267-b550-322a4cfa2ebf';
const fileUrl = `https://workspace.example.com/file/files-field/${fileId}`;

describe('resolveSignedMarkdown', () => {
  it('replaces a stored file URL with the signed one from BlockNote', () => {
    expect(
      resolveSignedMarkdown({
        markdown: `Intro\n\n![shot.png](${fileUrl}?token=expired)`,
        blocknote: JSON.stringify([
          { type: 'paragraph', content: [] },
          { type: 'image', props: { url: `${fileUrl}?token=fresh` } },
        ]),
      }),
    ).toBe(`Intro\n\n![shot.png](${fileUrl}?token=fresh)`);
  });

  it('finds images nested under another block', () => {
    expect(
      resolveSignedMarkdown({
        markdown: `- item\n  ![a](${fileUrl}?token=expired)`,
        blocknote: JSON.stringify([
          {
            type: 'bulletListItem',
            children: [{ type: 'image', props: { url: `${fileUrl}?token=fresh` } }],
          },
        ]),
      }),
    ).toBe(`- item\n  ![a](${fileUrl}?token=fresh)`);
  });

  it('keeps markdown as is when BlockNote is missing or unreadable', () => {
    const markdown = `![a](${fileUrl}?token=expired)`;

    expect(resolveSignedMarkdown({ markdown, blocknote: null })).toBe(markdown);
    expect(resolveSignedMarkdown({ markdown, blocknote: 'not-json' })).toBe(
      markdown,
    );
  });
});

describe('stripFileTokens', () => {
  it('makes two signings of the same body compare equal', () => {
    expect(stripFileTokens(`![a](${fileUrl}?token=first)`)).toBe(
      stripFileTokens(`![a](${fileUrl}?token=second)`),
    );
  });

  it('keeps a text edit visible', () => {
    expect(stripFileTokens(`One ![a](${fileUrl}?token=x)`)).not.toBe(
      stripFileTokens(`Two ![a](${fileUrl}?token=x)`),
    );
  });

  it('leaves links that are not stored files untouched', () => {
    const markdown = '[docs](https://example.com/page?token=keep)';

    expect(stripFileTokens(markdown)).toBe(markdown);
  });
});
