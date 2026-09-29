import { markdownToBlocknote } from './markdown-to-blocknote.util';

type RichTextValue = { blocknote?: string | null; markdown?: string | null };

// A RICH_TEXT field holds both a BlockNote document and a markdown rendering.
// BlockNote itself cannot run in the sandbox — there is no contentEditable
// remote element and no Selection API — so markdown is the half the composer
// edits, and the BlockNote half is derived from it on write.
export const readRichTextPlainValue = (
  value: RichTextValue | null | undefined,
): string => {
  if (typeof value?.markdown === 'string' && value.markdown.length > 0) {
    return value.markdown;
  }

  if (typeof value?.blocknote !== 'string' || value.blocknote.length === 0) {
    return '';
  }

  // A BlockNote document written by the host: pull the plain text out rather
  // than showing raw JSON. Unparseable input falls back to the empty string.
  try {
    const blocks: unknown = JSON.parse(value.blocknote);

    return collectText(blocks).replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    return '';
  }
};

const collectText = (node: unknown): string => {
  if (Array.isArray(node)) {
    return node.map(collectText).join('');
  }

  if (node === null || typeof node !== 'object') {
    return '';
  }

  const record = node as Record<string, unknown>;

  if (typeof record.text === 'string') {
    return record.text;
  }

  const content = collectText(record.content);
  const children = collectText(record.children);
  const isBlock = typeof record.type === 'string' && 'content' in record;

  return `${content}${children}${isBlock ? '\n' : ''}`;
};

// Both halves are written. Markdown is the source of truth the composer edits;
// the BlockNote half is derived from it so the host's own editor and any record
// table cell render the same document instead of an empty one.
export const buildRichTextValue = (
  markdown: string,
): { blocknote: string | null; markdown: string } => ({
  blocknote: markdownToBlocknote(markdown),
  markdown,
});
