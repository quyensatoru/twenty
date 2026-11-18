const MARKDOWN_SYNTAX_PATTERNS: [RegExp, string][] = [
  [/!\[[^\]]*\]\([^)]*\)/g, ''],
  [/\[([^\]]*)\]\([^)]*\)/g, '$1'],
  [/<[^>]+>/g, ''],
  [/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, ''],
  [/[*_~`]+/g, ''],
  [/\\([\\`*_{}[\]()#+\-.!>])/g, '$1'],
];

export const readMarkdownExcerpt = (
  markdown: string | null | undefined,
  maxLength = 180,
): string => {
  if (typeof markdown !== 'string') {
    return '';
  }

  const plainText = MARKDOWN_SYNTAX_PATTERNS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    markdown,
  )
    .replace(/\s+/g, ' ')
    .trim();

  return plainText.length > maxLength
    ? `${plainText.slice(0, maxLength - 1).trimEnd()}…`
    : plainText;
};
