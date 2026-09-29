import {
  type MarkdownBlock,
  type MarkdownInlineNode,
} from '../types/markdown-node';
import { parseMarkdownBlocks } from './parse-markdown-blocks.util';

type BlocknoteStyles = { bold?: true; italic?: true; code?: true };

type BlocknoteInlineContent =
  | { type: 'text'; text: string; styles: BlocknoteStyles }
  | {
      type: 'link';
      href: string;
      content: { type: 'text'; text: string; styles: BlocknoteStyles }[];
    };

type BlocknoteBlock = {
  type: string;
  props?: Record<string, string | number>;
  content?: BlocknoteInlineContent[];
};

const buildStyles = (node: MarkdownInlineNode): BlocknoteStyles => {
  if (node.type !== 'text') {
    return {};
  }

  return {
    ...(node.styles.isBold ? { bold: true as const } : {}),
    ...(node.styles.isItalic ? { italic: true as const } : {}),
    ...(node.styles.isCode ? { code: true as const } : {}),
  };
};

const toBlocknoteInlineContent = (
  nodes: MarkdownInlineNode[],
): BlocknoteInlineContent[] =>
  nodes.map((node) => {
    if (node.type === 'link') {
      return {
        type: 'link' as const,
        href: node.url,
        content: [{ type: 'text' as const, text: node.text, styles: {} }],
      };
    }

    // An inline image inside a paragraph has no BlockNote equivalent — image is
    // a block there — so it degrades to a link rather than being dropped.
    if (node.type === 'image') {
      return {
        type: 'link' as const,
        href: node.url,
        content: [
          { type: 'text' as const, text: node.alt || node.url, styles: {} },
        ],
      };
    }

    return { type: 'text' as const, text: node.text, styles: buildStyles(node) };
  });

const toBlocknoteBlock = (block: MarkdownBlock): BlocknoteBlock => {
  switch (block.type) {
    case 'heading':
      return {
        type: 'heading',
        props: { level: block.level },
        content: toBlocknoteInlineContent(block.content),
      };
    case 'bulletListItem':
    case 'numberedListItem':
    case 'quote':
      return {
        type: block.type,
        content: toBlocknoteInlineContent(block.content),
      };
    case 'codeBlock':
      return {
        type: 'codeBlock',
        ...(block.language === null ? {} : { props: { language: block.language } }),
        content: [{ type: 'text', text: block.code, styles: {} }],
      };
    case 'image':
      return {
        type: 'image',
        props: { url: block.url, name: block.alt, caption: '' },
      };
    case 'divider':
      return { type: 'divider' };
    case 'paragraph':
      return {
        type: 'paragraph',
        content: toBlocknoteInlineContent(block.content),
      };
  }
};

// The host stores both halves of a RICH_TEXT field and its own editor reads the
// BlockNote half first, so writing markdown alone would make anything the host
// renders look empty. Block ids are left out: they are optional in a
// PartialBlock document and the editor assigns its own on load.
export const markdownToBlocknote = (markdown: string): string | null => {
  if (markdown.trim() === '') {
    return null;
  }

  return JSON.stringify(parseMarkdownBlocks(markdown).map(toBlocknoteBlock));
};
