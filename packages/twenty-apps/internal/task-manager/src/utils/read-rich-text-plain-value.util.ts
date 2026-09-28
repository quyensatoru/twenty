type RichTextValue = { blocknote?: string | null; markdown?: string | null };

// A RICH_TEXT field holds both a BlockNote document and a markdown rendering.
// The sandbox cannot run BlockNote — no contentEditable, no Selection API — so
// the app reads and writes the markdown half. The host's own editor renders
// markdown-only values correctly, which is the same path the CSV importer uses.
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

export const buildRichTextValue = (
  markdown: string,
): { blocknote: null; markdown: string } => ({
  blocknote: null,
  markdown,
});
