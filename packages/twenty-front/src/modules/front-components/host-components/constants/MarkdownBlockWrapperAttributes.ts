// Markers on the <div>s the rich text editor writes around markdown for what
// markdown has no syntax for. The markdown preview reads the same names.
export const MARKDOWN_BLOCK_WRAPPER_ATTRIBUTES = {
  blockProperties: 'data-blocknote-block',
  children: 'data-blocknote-children',
  toggle: 'data-toggle',
} as const;
