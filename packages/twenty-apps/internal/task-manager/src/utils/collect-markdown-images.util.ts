import { type MarkdownBlock } from '../types/markdown-node';
import { parseMarkdownBlocks } from './parse-markdown-blocks.util';

export type MarkdownImage = { alt: string; url: string };

const readBlockImages = (block: MarkdownBlock): MarkdownImage[] => {
  if (block.type === 'image') {
    return [{ alt: block.alt, url: block.url }];
  }

  if (block.type === 'codeBlock' || block.type === 'divider') {
    return [];
  }

  return block.content
    .filter((node) => node.type === 'image')
    .map((node) => ({ alt: node.alt, url: node.url }));
};

// The pictures a piece of markdown refers to, in the order they appear. A
// textarea can only hold text, so this is what lets the author keep seeing an
// image while editing the source that points at it.
export const collectMarkdownImages = (markdown: string): MarkdownImage[] => {
  const images = parseMarkdownBlocks(markdown).flatMap(readBlockImages);
  const seenUrls = new Set<string>();

  return images.filter((image) => {
    if (seenUrls.has(image.url)) {
      return false;
    }

    seenUrls.add(image.url);

    return true;
  });
};
