import {
  EMPTY_MARKDOWN_STYLES,
  type MarkdownInlineNode,
  type MarkdownInlineStyles,
} from '../types/markdown-node';

// Ordered alternation: an image has to win over a link, and a fenced code span
// over emphasis, otherwise `![a](u)` is read as text plus a link and
// `` `a * b` `` turns into an italic run.
const INLINE_PATTERN =
  /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]*)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|(https?:\/\/[^\s<>()[\]]+)/g;

const IMAGE_URL_PATTERN = /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?|#|$)/i;

export const isImageUrl = (url: string): boolean => IMAGE_URL_PATTERN.test(url);

const pushText = (
  nodes: MarkdownInlineNode[],
  text: string,
  styles: Partial<MarkdownInlineStyles> = {},
): void => {
  if (text === '') {
    return;
  }

  nodes.push({
    type: 'text',
    text,
    styles: { ...EMPTY_MARKDOWN_STYLES, ...styles },
  });
};

// Emphasis is not nested on purpose: a single flat pass keeps the renderer,
// the BlockNote serialiser and the tests reading the same node list, and
// nested emphasis is not something the toolbar can produce anyway.
export const parseMarkdownInline = (line: string): MarkdownInlineNode[] => {
  const nodes: MarkdownInlineNode[] = [];
  let lastIndex = 0;

  INLINE_PATTERN.lastIndex = 0;

  for (;;) {
    const match = INLINE_PATTERN.exec(line);

    if (match === null) {
      break;
    }

    pushText(nodes, line.slice(lastIndex, match.index));
    lastIndex = match.index + match[0].length;

    const [
      ,
      imageAlt,
      imageUrl,
      linkText,
      linkUrl,
      codeText,
      boldStarText,
      boldUnderscoreText,
      italicStarText,
      italicUnderscoreText,
      bareUrl,
    ] = match;

    if (imageUrl !== undefined) {
      nodes.push({ type: 'image', alt: imageAlt ?? '', url: imageUrl });
      continue;
    }

    if (linkUrl !== undefined) {
      nodes.push({
        type: 'link',
        text: linkText === '' ? linkUrl : (linkText ?? linkUrl),
        url: linkUrl,
      });
      continue;
    }

    if (codeText !== undefined) {
      pushText(nodes, codeText, { isCode: true });
      continue;
    }

    const boldText = boldStarText ?? boldUnderscoreText;

    if (boldText !== undefined) {
      pushText(nodes, boldText, { isBold: true });
      continue;
    }

    const italicText = italicStarText ?? italicUnderscoreText;

    if (italicText !== undefined) {
      pushText(nodes, italicText, { isItalic: true });
      continue;
    }

    if (bareUrl !== undefined) {
      nodes.push({ type: 'link', text: bareUrl, url: bareUrl });
    }
  }

  pushText(nodes, line.slice(lastIndex));

  return nodes;
};
