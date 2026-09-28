import { escapeHtml } from './escape-html.util';
import { sanitizeUrl } from './sanitize-url.util';

// A deliberately tiny subset of Markdown, enough for marketing copy: **bold**,
// *italic*, [label](url) and line breaks. Input is plain text; everything is
// escaped before any tag is produced, so no author-supplied HTML survives.
export const renderInlineMarkup = (text: string, linkColor: string): string =>
  escapeHtml(text)
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_match, label: string, url: string) => {
        const href = escapeHtml(sanitizeUrl(url.replace(/&amp;/g, '&')));

        return `<a href="${href}" style="color:${escapeHtml(linkColor)};text-decoration:underline;">${label}</a>`;
      },
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\r?\n/g, '<br />');
