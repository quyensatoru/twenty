export type InlineMarkdownNode =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; url: string }
  | { type: 'image'; alt: string; url: string }
  | { type: 'bold'; children: InlineMarkdownNode[] }
  | { type: 'italic'; children: InlineMarkdownNode[] };

// Crisp messages are written in its markdown flavour (support pastes **bold**,
// links as <url> or [label](url)). Only the inline marks are parsed; line
// breaks and lists stay as typed, which pre-wrap already shows faithfully.
const INLINE_PATTERN = new RegExp(
  [
    '!\\[([^\\]\\n]*)\\]\\((https?://[^\\s)]+)\\)',
    '`([^`\\n]+)`',
    '\\*\\*([^*\\n][\\s\\S]*?)\\*\\*',
    '(?<![\\w*])\\*([^*\\s][^*\\n]*?)\\*(?![\\w*])',
    '\\[([^\\]\\n]+)\\]\\((https?://[^\\s)]+)\\)',
    '<(https?://[^\\s>]+)>',
    '(https?://[^\\s<]+[^\\s<.,;:!?)\\]\'"])',
  ].join('|'),
  'g',
);

export const parseInlineMarkdown = (text: string): InlineMarkdownNode[] => {
  const nodes: InlineMarkdownNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, index) });
    }

    const [
      ,
      imageAlt,
      imageUrl,
      code,
      bold,
      italic,
      linkLabel,
      linkUrl,
      angleUrl,
      bareUrl,
    ] = match;

    if (imageUrl !== undefined) {
      nodes.push({ type: 'image', alt: imageAlt ?? '', url: imageUrl });
    } else if (code !== undefined) {
      nodes.push({ type: 'code', text: code });
    } else if (bold !== undefined) {
      nodes.push({ type: 'bold', children: parseInlineMarkdown(bold) });
    } else if (italic !== undefined) {
      nodes.push({ type: 'italic', children: parseInlineMarkdown(italic) });
    } else if (linkLabel !== undefined && linkUrl !== undefined) {
      nodes.push({ type: 'link', text: linkLabel, url: linkUrl });
    } else {
      const url = angleUrl ?? bareUrl ?? '';

      nodes.push({ type: 'link', text: url, url });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return nodes;
};
