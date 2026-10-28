import { type JSONContent } from '@tiptap/core';
import {
  type TipTapDocument,
  tipTapDocumentToMarkdown,
} from 'twenty-shared/utils';

export const NON_BREAKING_SPACE = String.fromCharCode(160);

const isEmptyParagraph = (node: JSONContent) =>
  node.type === 'paragraph' &&
  (node.content ?? []).every(
    (child) => child.type === 'text' && (child.text ?? '') === '',
  );

// Markdown collapses blank lines, so an empty paragraph is written as
// `&nbsp;`, which the guest's preview reads back as an empty paragraph.
// Trailing ones are only where the caret was left, not content.
export const convertEditorDocumentToMarkdown = (
  document: JSONContent,
): string => {
  const blocks = [...(document.content ?? [])];

  while (blocks.length > 0 && isEmptyParagraph(blocks[blocks.length - 1])) {
    blocks.pop();
  }

  const markdown = tipTapDocumentToMarkdown({
    ...document,
    content: blocks.map((block) =>
      isEmptyParagraph(block)
        ? {
            type: 'paragraph',
            content: [{ type: 'text', text: NON_BREAKING_SPACE }],
          }
        : block,
    ),
  } as TipTapDocument);

  return markdown.replace(
    new RegExp(`^${NON_BREAKING_SPACE}$`, 'gm'),
    '&nbsp;',
  );
};
