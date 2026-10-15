import {
  type MarkdownBlock,
  type MarkdownInlineNode,
} from '../types/markdown-node';
import { parseMarkdownBlocks } from './parse-markdown-blocks.util';
import { readBlocknoteSafeUrl } from './read-blocknote-safe-url.util';

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
    // An inline image inside a paragraph has no BlockNote equivalent — image is
    // a block there — so it degrades to a link rather than being dropped.
    if (node.type === 'link' || node.type === 'image') {
      const text = node.type === 'link' ? node.text : node.alt || node.url;
      const href = readBlocknoteSafeUrl(node.url);

      if (href === null) {
        return { type: 'text' as const, text, styles: {} };
      }

      return {
        type: 'link' as const,
        href,
        content: [{ type: 'text' as const, text, styles: {} }],
      };
    }

    return {
      type: 'text' as const,
      text: node.text,
      styles: buildStyles(node),
    };
  });

// A media file the server would refuse is kept as its address in text, so the
// save goes through and nothing disappears from the derived half.
const unsafeMediaParagraph = (url: string): BlocknoteBlock => ({
  type: 'paragraph',
  content: [{ type: 'text', text: url, styles: {} }],
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
        ...(block.language === null
          ? {}
          : { props: { language: block.language } }),
        content: [{ type: 'text', text: block.code, styles: {} }],
      };
    case 'image': {
      const url = readBlocknoteSafeUrl(block.url);

      if (url === null) {
        return unsafeMediaParagraph(block.url);
      }

      return {
        type: 'image',
        props: {
          url,
          name: block.alt,
          caption: block.caption ?? '',
          ...(block.width === undefined ? {} : { previewWidth: block.width }),
        },
      };
    }
    // The server re-signs file URLs only where a block carries them, so a
    // video or audio file left out here would stop loading once its token
    // expired.
    case 'video':
    case 'audio': {
      const url = readBlocknoteSafeUrl(block.url);

      if (url === null) {
        return unsafeMediaParagraph(block.url);
      }

      return {
        type: block.type,
        props: { url, caption: block.caption ?? '' },
      };
    }
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
