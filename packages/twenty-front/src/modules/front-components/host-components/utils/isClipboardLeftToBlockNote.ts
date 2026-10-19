import { isObject, isString } from '@sniptt/guards';

// Clipboard formats BlockNote's own handler already pastes faithfully: its
// own blocks and files.
const FORMATS_LEFT_TO_BLOCKNOTE = ['blocknote/html', 'Files'];

// Elements that mean the source rendered its text (a web page, a document, a
// rich editor), so its HTML carries formatting the plain text has lost.
const RENDERED_HTML_SELECTOR = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'table',
  'blockquote',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'del',
  'a',
  'img',
  'code',
].join(',');

// Chat apps, mail clients and plain-text viewers wrap what they copy in HTML
// with only a <div> or <br> per line. BlockNote pastes that HTML whenever its
// guess at markdown misses (a heading longer than 64 characters, `* ` bullets),
// so pasted markdown came out as literal text with a hard break per line.
const isUnformattedHtml = (html: string) => {
  const template = document.createElement('template');

  template.innerHTML = html;

  return template.content.querySelector(RENDERED_HTML_SELECTOR) === null;
};

// VS Code (and its forks) tags every copy with the file's language. BlockNote
// pastes it as a code block of that language, or, for markdown, as literal
// text with a hard break per line, so a copied .md file kept its `**` and `#`.
const CODE_EDITOR_MARKDOWN_MODES = new Set(['markdown', 'mdx', 'plaintext']);

const isMarkdownFromCodeEditor = (clipboard: DataTransfer) => {
  try {
    const editorData: unknown = JSON.parse(
      clipboard.getData('vscode-editor-data'),
    );

    return (
      isObject(editorData) &&
      'mode' in editorData &&
      isString(editorData.mode) &&
      CODE_EDITOR_MARKDOWN_MODES.has(editorData.mode)
    );
  } catch {
    return false;
  }
};

// Whether BlockNote's own paste handler should take the clipboard; otherwise
// its text is read as markdown.
export const isClipboardLeftToBlockNote = (clipboard: DataTransfer) => {
  if (
    FORMATS_LEFT_TO_BLOCKNOTE.some((format) => clipboard.types.includes(format))
  ) {
    return true;
  }

  // VS Code's HTML is unformatted for every language, so the language decides.
  if (clipboard.types.includes('vscode-editor-data')) {
    return !isMarkdownFromCodeEditor(clipboard);
  }

  return (
    clipboard.types.includes('text/html') &&
    !isUnformattedHtml(clipboard.getData('text/html'))
  );
};
