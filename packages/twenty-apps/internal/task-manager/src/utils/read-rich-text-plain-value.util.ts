type RichTextValue = { markdown?: string | null };

// The server derives markdown from every stored document, so it is the only
// half this app reads.
export const readRichTextPlainValue = (
  value: RichTextValue | null | undefined,
): string => value?.markdown ?? '';

// Markdown alone: the server keeps it verbatim and derives the TipTap document.
export const buildRichTextValue = (markdown: string): { markdown: string } => ({
  markdown,
});
