import { type MarkdownBlock } from '../types/markdown-node';
import { parseMarkdownInline } from './parse-markdown-inline.util';

const HEADING_PATTERN = /^(#{1,3})\s+(.*)$/;
const BULLET_PATTERN = /^\s*[-*+]\s+(.*)$/;
const NUMBERED_PATTERN = /^\s*\d+[.)]\s+(.*)$/;
const QUOTE_PATTERN = /^\s*>\s?(.*)$/;
const DIVIDER_PATTERN = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
const FENCE_PATTERN = /^\s*```(.*)$/;
const LONE_IMAGE_PATTERN = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

// A deliberately small subset: headings, both list kinds, quotes, fenced code,
// dividers and standalone images. It is the subset the composer's toolbar can
// produce and the subset BlockNote can round-trip, so what is typed, what is
// previewed and what the host would render stay the same document.
export const parseMarkdownBlocks = (markdown: string): MarkdownBlock[] => {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: 'paragraph',
      content: parseMarkdownInline(paragraphLines.join('\n')),
    });
    paragraphLines = [];
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const fenceMatch = FENCE_PATTERN.exec(line);

    if (fenceMatch !== null) {
      flushParagraph();

      const language = fenceMatch[1].trim();
      const codeLines: string[] = [];

      index++;

      while (index < lines.length && FENCE_PATTERN.exec(lines[index]) === null) {
        codeLines.push(lines[index]);
        index++;
      }

      blocks.push({
        type: 'codeBlock',
        code: codeLines.join('\n'),
        language: language === '' ? null : language,
      });
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      continue;
    }

    if (DIVIDER_PATTERN.test(line)) {
      flushParagraph();
      blocks.push({ type: 'divider' });
      continue;
    }

    const headingMatch = HEADING_PATTERN.exec(line);

    if (headingMatch !== null) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        content: parseMarkdownInline(headingMatch[2]),
      });
      continue;
    }

    const bulletMatch = BULLET_PATTERN.exec(line);

    if (bulletMatch !== null) {
      flushParagraph();
      blocks.push({
        type: 'bulletListItem',
        content: parseMarkdownInline(bulletMatch[1]),
      });
      continue;
    }

    const numberedMatch = NUMBERED_PATTERN.exec(line);

    if (numberedMatch !== null) {
      flushParagraph();
      blocks.push({
        type: 'numberedListItem',
        content: parseMarkdownInline(numberedMatch[1]),
      });
      continue;
    }

    const quoteMatch = QUOTE_PATTERN.exec(line);

    if (quoteMatch !== null) {
      flushParagraph();
      blocks.push({
        type: 'quote',
        content: parseMarkdownInline(quoteMatch[1]),
      });
      continue;
    }

    const loneImageMatch = LONE_IMAGE_PATTERN.exec(line.trim());

    if (loneImageMatch !== null) {
      flushParagraph();
      blocks.push({
        type: 'image',
        alt: loneImageMatch[1],
        url: loneImageMatch[2],
      });
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();

  return blocks;
};
