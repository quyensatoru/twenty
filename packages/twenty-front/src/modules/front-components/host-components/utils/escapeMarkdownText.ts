const ESCAPED_EVERYWHERE = new Set(['\\', '`', '*', '[', ']', '<', '~', '&']);
const ESCAPED_AT_LINE_START = new Set(['#', '>', '+', '-', '=']);
const ORDERED_LIST_MARKER = /^\d+[.)]/;
const WORD_CHARACTER = /[\p{L}\p{N}]/u;
const NON_BREAKING_SPACE = '\u00a0';
// Numeric, not `&nbsp;`: the markdown preview runs in a sandbox without a DOM,
// where the browser build of its entity decoder cannot resolve named entities
// and would print `&nbsp;` as text.
export const NON_BREAKING_SPACE_ENTITY = '&#xA0;';

// Typed text has to come back as the same text, not as whatever markdown it
// happens to spell: `*draft*` would otherwise reload in italics and `<div>`
// would be swallowed as HTML. Spaces markdown would collapse or strip (leading
// ones, runs of them) are written as non-breaking spaces so the indentation
// someone typed is still there when the text is read back.
export const escapeMarkdownText = (
  text: string,
  { isAtLineStart }: { isAtLineStart: boolean },
): string => {
  let escaped = '';
  let isLineStart = isAtLineStart;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];

    if (character === '\n') {
      escaped += character;
      isLineStart = true;
      continue;
    }

    if (character === NON_BREAKING_SPACE) {
      escaped += NON_BREAKING_SPACE_ENTITY;
      continue;
    }

    if (character === ' ') {
      const isAfterSpace = index > 0 && text[index - 1] === ' ';

      escaped += isLineStart || isAfterSpace ? NON_BREAKING_SPACE_ENTITY : ' ';
      continue;
    }

    if (isLineStart) {
      const orderedListMarker = ORDERED_LIST_MARKER.exec(text.slice(index));

      if (orderedListMarker !== null) {
        const marker = orderedListMarker[0];

        escaped += `${marker.slice(0, -1)}\\${marker.slice(-1)}`;
        index += marker.length - 1;
        isLineStart = false;
        continue;
      }
    }

    const isIntrawordUnderscore =
      character === '_' &&
      WORD_CHARACTER.test(text[index - 1] ?? '') &&
      WORD_CHARACTER.test(text[index + 1] ?? '');
    const shouldEscape =
      ESCAPED_EVERYWHERE.has(character) ||
      (character === '_' && !isIntrawordUnderscore) ||
      (isLineStart && ESCAPED_AT_LINE_START.has(character));

    escaped += shouldEscape ? `\\${character}` : character;
    isLineStart = false;
  }

  return escaped;
};
