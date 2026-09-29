export type MarkdownInlineStyles = {
  isBold: boolean;
  isItalic: boolean;
  isCode: boolean;
};

export type MarkdownInlineNode =
  | { type: 'text'; text: string; styles: MarkdownInlineStyles }
  | { type: 'link'; text: string; url: string }
  | { type: 'image'; alt: string; url: string };

export type MarkdownBlock =
  | { type: 'paragraph'; content: MarkdownInlineNode[] }
  | { type: 'heading'; level: 1 | 2 | 3; content: MarkdownInlineNode[] }
  | { type: 'bulletListItem'; content: MarkdownInlineNode[] }
  | { type: 'numberedListItem'; content: MarkdownInlineNode[] }
  | { type: 'quote'; content: MarkdownInlineNode[] }
  | { type: 'image'; alt: string; url: string }
  | { type: 'codeBlock'; code: string; language: string | null }
  | { type: 'divider' };

export const EMPTY_MARKDOWN_STYLES: MarkdownInlineStyles = {
  isBold: false,
  isItalic: false,
  isCode: false,
};
