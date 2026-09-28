const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

// Plain-text alternative for HTML-mode templates. Links keep their target in
// parentheses, since a text client cannot follow a hidden href.
export const htmlToText = (html: string): string =>
  html
    .replace(/<head\b[\s\S]*?<\/head\s*>/gi, '')
    .replace(/<(style|script)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<div\b[^>]*display:\s*none[^>]*>[\s\S]*?<\/div\s*>/gi, '')
    .replace(
      /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a\s*>/gi,
      (_match, href: string, label: string) => {
        const text = label.replace(/<[^>]+>/g, '').trim();

        return href === '' || href === '#' || href === text
          ? text
          : `${text} (${href})`;
      },
    )
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|tr|li|table)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(
      /&(amp|lt|gt|quot|#39|nbsp);/g,
      (entity) => ENTITIES[entity] ?? entity,
    )
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
