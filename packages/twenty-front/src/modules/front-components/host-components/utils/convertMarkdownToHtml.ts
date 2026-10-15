import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { isSafeUrl } from 'twenty-shared/utils';
import { unified } from 'unified';

const BLOCK_CONTAINER_TAG_NAMES = new Set([
  'BLOCKQUOTE',
  'DIV',
  'FIGURE',
  'LI',
  'OL',
  'TABLE',
  'TBODY',
  'THEAD',
  'TR',
  'UL',
]);
const LAYOUT_WHITESPACE = /^[ \t\r\n]*$/;

const markdownToHtmlProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

// The HTML pretty-prints with newlines between blocks and after each <br>.
// BlockNote reads every one of them as a typed space: a quote would reload as
// " quote " and the line after a hard break would start with a space.
const removeLayoutWhitespace = (parent: Node) => {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const isLayoutWhitespace =
        (parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
          BLOCK_CONTAINER_TAG_NAMES.has(parent.nodeName)) &&
        LAYOUT_WHITESPACE.test(child.textContent ?? '');

      if (isLayoutWhitespace) {
        parent.removeChild(child);
        continue;
      }

      if (child.previousSibling?.nodeName === 'BR') {
        child.textContent = (child.textContent ?? '').replace(/^\n/, '');
      }

      continue;
    }

    // A fenced block always ends in a newline that is not part of the code.
    if (child.nodeName === 'CODE' && parent.nodeName === 'PRE') {
      const lastText = child.lastChild;

      if (lastText?.nodeType === Node.TEXT_NODE) {
        lastText.textContent = (lastText.textContent ?? '').replace(/\n$/, '');
      }

      continue;
    }

    removeLayoutWhitespace(child);
  }
};

// GFM footnotes come out as links to anchors on the page (`#user-content-fn-1`)
// with `↩` links back. An editor block has no anchors to jump to, and the
// server refuses to save a link that is not http(s), mailto, tel or a path, so
// a reference keeps its `[1]` as text and the back links go. Any other link
// the server would refuse is kept as its text for the same reason.
const flattenLinksTheServerRefuses = (root: DocumentFragment) => {
  for (const reference of Array.from(
    root.querySelectorAll('sup > a[data-footnote-ref]'),
  )) {
    reference.parentElement?.replaceWith(`[${reference.textContent ?? ''}]`);
  }

  for (const element of Array.from(
    root.querySelectorAll('a[data-footnote-backref], section[data-footnotes] > h2'),
  )) {
    element.remove();
  }

  for (const link of Array.from(root.querySelectorAll('a'))) {
    const href = link.getAttribute('href')?.trim() ?? '';

    if (href === '' || !isSafeUrl(href)) {
      link.replaceWith(...Array.from(link.childNodes));
    }
  }
};

// Parsed the way the markdown preview parses it (remark with GFM, raw HTML
// kept), so the editor opens on the same document the reader was shown.
// BlockNote's own markdown parser is not CommonMark: it cannot read an
// escaped `<`, leaves entities undecoded and adds a space after every hard
// break.
export const convertMarkdownToHtml = (markdown: string): string => {
  const html = String(markdownToHtmlProcessor.processSync(markdown));
  const template = document.createElement('template');

  template.innerHTML = html;
  flattenLinksTheServerRefuses(template.content);
  removeLayoutWhitespace(template.content);

  return template.innerHTML;
};
