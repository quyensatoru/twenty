import { describe, expect, it } from 'vitest';

import { formatMinutes, parseMinutes } from '../format-minutes.util';
import {
  buildRichTextValue,
  readRichTextPlainValue,
} from '../read-rich-text-plain-value.util';

describe('formatMinutes', () => {
  it('shows minutes below an hour', () => {
    expect(formatMinutes(45)).toBe('45m');
  });

  it('shows whole hours without a minute part', () => {
    expect(formatMinutes(120)).toBe('2h');
  });

  it('shows hours and minutes together', () => {
    expect(formatMinutes(90)).toBe('1h 30m');
  });

  it('treats nothing logged as zero', () => {
    expect(formatMinutes(null)).toBe('0m');
    expect(formatMinutes(0)).toBe('0m');
  });
});

describe('parseMinutes', () => {
  it('reads a bare number as minutes', () => {
    expect(parseMinutes('90')).toBe(90);
  });

  it('reads the hour and minute forms', () => {
    expect(parseMinutes('1h30m')).toBe(90);
    expect(parseMinutes('1h 30')).toBe(90);
    expect(parseMinutes('2h')).toBe(120);
    expect(parseMinutes('45m')).toBe(45);
  });

  // Returning null rather than 0 is what lets the form refuse the submit
  // instead of silently logging nothing.
  it('returns null for input with no number in it', () => {
    expect(parseMinutes('')).toBeNull();
    expect(parseMinutes('soon')).toBeNull();
  });
});

describe('readRichTextPlainValue', () => {
  it('prefers the markdown half', () => {
    expect(
      readRichTextPlainValue({ blocknote: '[]', markdown: 'Hello' }),
    ).toBe('Hello');
  });

  it('pulls plain text out of a BlockNote document written by the host', () => {
    const blocknote = JSON.stringify([
      { type: 'paragraph', content: [{ type: 'text', text: 'First line' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Second line' }] },
    ]);

    expect(readRichTextPlainValue({ blocknote, markdown: null })).toBe(
      'First line\nSecond line',
    );
  });

  it('returns nothing rather than raw JSON when the document will not parse', () => {
    expect(readRichTextPlainValue({ blocknote: 'not json', markdown: null })).toBe(
      '',
    );
  });

  it('handles an absent value', () => {
    expect(readRichTextPlainValue(null)).toBe('');
    expect(readRichTextPlainValue(undefined)).toBe('');
  });
});

describe('buildRichTextValue', () => {
  // The host renders a markdown-only value with its own editor, so writing the
  // markdown half alone is a complete write, not a partial one.
  it('writes the markdown half and clears the blocknote half', () => {
    expect(buildRichTextValue('Some text')).toEqual({
      blocknote: null,
      markdown: 'Some text',
    });
  });
});
