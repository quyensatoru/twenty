const FENCE_LINE = /^\s*(```|~~~)/;

// A bare address right before a hard break: an autolink runs to the next
// space, so it would take the break's backslash as part of the address.
const BARE_URL_BEFORE_HARD_BREAK =
  /(^|[\s(])(https?:\/\/[^\s<>]*[^\s<>\\])\\\n/g;
// A hard break alone on the last line of a paragraph: it breaks nothing, so a
// reader shows the backslash. It stood for an empty line, which it stays.
const LONE_TRAILING_HARD_BREAK = /(^|\n)\\(?=\n{2,}|\n*$)/g;
// A hard break right after the last word of a paragraph, likewise shown as a
// backslash, with nothing after it to break to.
const TRAILING_HARD_BREAK_AFTER_TEXT = /([^\s\\])\\(?=\n{2,}|\n*$)/g;

const normalizeProse = (prose: string): string =>
  prose
    .replace(BARE_URL_BEFORE_HARD_BREAK, '$1<$2>\\\n')
    .replace(LONE_TRAILING_HARD_BREAK, '$1&nbsp;')
    .replace(TRAILING_HARD_BREAK_AFTER_TEXT, '$1');

// BlockNote writes a hard break as a backslash before the newline, which
// markdown readers misread in two places and show as a stray "\". Fenced code
// is left exactly as written.
export const normalizeMarkdownHardBreaks = (markdown: string): string => {
  const lines = markdown.split('\n');
  const parts: string[] = [];
  let prose: string[] = [];
  let isInFence = false;

  const flushProse = () => {
    if (prose.length > 0) {
      parts.push(normalizeProse(prose.join('\n')));
      prose = [];
    }
  };

  for (const line of lines) {
    if (FENCE_LINE.test(line)) {
      if (!isInFence) {
        flushProse();
      }

      isInFence = !isInFence;
      parts.push(line);
      continue;
    }

    if (isInFence) {
      parts.push(line);
    } else {
      prose.push(line);
    }
  }

  flushProse();

  return parts.join('\n');
};
