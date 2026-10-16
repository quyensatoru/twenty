import {
  type Block,
  type BlockNoteEditor,
  COLORS_DEFAULT,
  type PartialBlock,
} from '@blocknote/core';
import { isDefined } from 'twenty-shared/utils';

import { MARKDOWN_BLOCK_WRAPPER_ATTRIBUTES } from '@/front-components/host-components/constants/MarkdownBlockWrapperAttributes';
import { normalizeMarkdownHardBreaks } from '@/front-components/host-components/utils/normalizeMarkdownHardBreaks';
import {
  NON_BREAKING_SPACE_ENTITY,
  escapeMarkdownText,
} from '@/front-components/host-components/utils/escapeMarkdownText';

type InlineContent = Extract<Block['content'], unknown[]>;
type StyledText = Extract<InlineContent[number], { type: 'text' }>;
type MediaBlock = Extract<Block, { type: 'image' | 'video' | 'audio' }>;
type ColorName = keyof typeof COLORS_DEFAULT;

const LIST_ITEM_BLOCK_TYPES = new Set([
  'bulletListItem',
  'numberedListItem',
  'checkListItem',
]);

// Markdown collapses blank lines, so an empty paragraph has to carry something
// that renders as nothing to survive the trip.
const EMPTY_PARAGRAPH_MARKDOWN = NON_BREAKING_SPACE_ENTITY;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const readColor = (color: unknown): ColorName | null =>
  typeof color === 'string' && color in COLORS_DEFAULT
    ? (color as ColorName)
    : null;

// The data attributes are what BlockNote reads the colour back from; the
// inline style is what any other markdown renderer shows.
const wrapInColorSpan = (
  html: string,
  styleType: 'textColor' | 'backgroundColor',
  color: string | undefined,
) => {
  const colorName = readColor(color);

  if (!isDefined(colorName)) {
    return html;
  }

  const cssDeclaration =
    styleType === 'textColor'
      ? `color: ${COLORS_DEFAULT[colorName].text};`
      : `background-color: ${COLORS_DEFAULT[colorName].background};`;

  return `<span style="${cssDeclaration}" data-style-type="${styleType}" data-value="${colorName}">${html}</span>`;
};

const prepareStyledText = (
  styledText: StyledText,
  isAtLineStart: boolean,
): StyledText => {
  if (styledText.styles.code === true) {
    return styledText;
  }

  const { underline, textColor, backgroundColor, ...markdownStyles } =
    styledText.styles;

  let text = escapeMarkdownText(styledText.text, { isAtLineStart });

  if (underline === true) {
    text = `<u>${text}</u>`;
  }

  text = wrapInColorSpan(text, 'backgroundColor', backgroundColor);
  text = wrapInColorSpan(text, 'textColor', textColor);

  return { type: 'text', text, styles: markdownStyles };
};

const prepareInlineContent = (content: InlineContent): InlineContent =>
  content.map((element, index) => {
    if (element.type === 'link') {
      return {
        ...element,
        content: element.content.map((styledText) =>
          prepareStyledText(styledText, false),
        ),
      };
    }

    return prepareStyledText(element, index === 0);
  });

const isEmptyParagraph = (block: Block) =>
  block.type === 'paragraph' &&
  block.children.length === 0 &&
  block.content.every(
    (element) => element.type === 'text' && element.text === '',
  );

const isListItem = (block: Block) => LIST_ITEM_BLOCK_TYPES.has(block.type);

const readBlockProperties = (block: Block) => {
  const properties: Record<string, unknown> = block.props;
  const textAlignment = properties.textAlignment;

  return {
    textAlignment:
      typeof textAlignment === 'string' && textAlignment !== 'left'
        ? textAlignment
        : null,
    textColor: readColor(properties.textColor),
    backgroundColor: readColor(properties.backgroundColor),
    isToggle:
      block.type === 'toggleListItem' || properties.isToggleable === true,
  };
};

const needsPropertiesWrapper = (block: Block) => {
  const { textAlignment, textColor, backgroundColor, isToggle } =
    readBlockProperties(block);

  return (
    isDefined(textAlignment) ||
    isDefined(textColor) ||
    isDefined(backgroundColor) ||
    isToggle
  );
};

// Markdown nests a plain list item inside a plain list item and nothing else.
const canMarkdownHoldChildren = (block: Block): boolean =>
  block.children.length === 0 ||
  (isListItem(block) &&
    block.children.every(
      (child) =>
        isListItem(child) &&
        !needsPropertiesWrapper(child) &&
        canMarkdownHoldChildren(child),
    ));

// BlockNote writes video as an image and drops media widths and audio
// captions, so the media blocks it cannot round trip go out as the HTML its
// own parser and the markdown preview both read.
const buildMediaHtml = (block: MediaBlock): string | null => {
  const { url, caption } = block.props;
  const previewWidth =
    'previewWidth' in block.props ? block.props.previewWidth : undefined;
  const widthAttribute = isDefined(previewWidth)
    ? ` width="${Math.round(previewWidth)}"`
    : '';

  if (block.type === 'image' && widthAttribute === '') {
    return null;
  }

  const source = escapeHtml(url);
  const media =
    block.type === 'image'
      ? `<img src="${source}" alt="${escapeHtml(block.props.name)}"${widthAttribute}>`
      : `<${block.type} src="${source}" controls${widthAttribute}></${block.type}>`;

  if (caption === '') {
    return media;
  }

  return `<figure>${media}<figcaption>${escapeHtml(caption)}</figcaption></figure>`;
};

// What the properties wrapper carries is taken off the block itself, or
// BlockNote's exporter would drop it anyway.
const toMarkdownNeutralProperties = (block: Block) => {
  const properties: Record<string, unknown> = { ...block.props };

  if ('textAlignment' in properties) {
    properties.textAlignment = 'left';
  }

  if ('textColor' in properties) {
    properties.textColor = 'default';
  }

  if ('backgroundColor' in properties) {
    properties.backgroundColor = 'default';
  }

  if ('isToggleable' in properties) {
    properties.isToggleable = false;
  }

  return properties;
};

// One block, without its children, in the shape BlockNote's exporter writes
// faithfully. Null for a block that has nothing to write yet.
const prepareBlock = (block: Block): PartialBlock | null => {
  const props = toMarkdownNeutralProperties(block);

  switch (block.type) {
    case 'image':
    case 'video':
    case 'audio': {
      // A media block still waiting for its file has nothing to show yet.
      if (block.props.url === '') {
        return null;
      }

      const mediaHtml = buildMediaHtml(block);

      if (!isDefined(mediaHtml)) {
        return { ...block, props, children: [] } as PartialBlock;
      }

      return {
        type: 'paragraph',
        content: [{ type: 'text', text: mediaHtml, styles: {} }],
      };
    }
    case 'table':
      return {
        ...block,
        props,
        content: {
          ...block.content,
          headerRows: 1,
          rows: block.content.rows.map((row) => ({
            ...row,
            cells: row.cells.map((cell) =>
              Array.isArray(cell)
                ? {
                    type: 'tableCell' as const,
                    content: prepareInlineContent(cell),
                  }
                : { ...cell, content: prepareInlineContent(cell.content) },
            ),
          })),
        },
        children: [],
      } as PartialBlock;
    case 'paragraph':
      if (isEmptyParagraph(block)) {
        return {
          type: 'paragraph',
          content: [
            { type: 'text', text: EMPTY_PARAGRAPH_MARKDOWN, styles: {} },
          ],
        };
      }

      return {
        ...block,
        props,
        content: prepareInlineContent(block.content),
        children: [],
      } as PartialBlock;
    case 'toggleListItem':
      return {
        ...block,
        type: 'bulletListItem',
        props,
        content: prepareInlineContent(block.content),
        children: [],
      } as PartialBlock;
    case 'heading':
    case 'quote':
    case 'bulletListItem':
    case 'numberedListItem':
    case 'checkListItem':
      return {
        ...block,
        props,
        content: prepareInlineContent(block.content),
        children: [],
      } as PartialBlock;
    default:
      return { ...block, props, children: [] } as PartialBlock;
  }
};

const prepareBlockWithChildren = (block: Block): PartialBlock | null => {
  const prepared = prepareBlock(block);

  if (!isDefined(prepared)) {
    return null;
  }

  return {
    ...prepared,
    children: block.children.flatMap(
      (child) => prepareBlockWithChildren(child) ?? [],
    ),
  } as PartialBlock;
};

const buildPropertiesWrapperOpening = (block: Block) => {
  const { textAlignment, textColor, backgroundColor, isToggle } =
    readBlockProperties(block);
  const attributes: string[] = [
    MARKDOWN_BLOCK_WRAPPER_ATTRIBUTES.blockProperties,
  ];
  const styles: string[] = [];

  if (isDefined(textAlignment)) {
    attributes.push(`data-text-alignment="${escapeHtml(textAlignment)}"`);
    styles.push(`text-align: ${escapeHtml(textAlignment)};`);
  }

  if (isDefined(textColor)) {
    attributes.push(`data-text-color="${textColor}"`);
    styles.push(`color: ${COLORS_DEFAULT[textColor].text};`);
  }

  if (isDefined(backgroundColor)) {
    attributes.push(`data-background-color="${backgroundColor}"`);
    styles.push(
      `background-color: ${COLORS_DEFAULT[backgroundColor].background};`,
    );
  }

  if (isToggle) {
    attributes.push(MARKDOWN_BLOCK_WRAPPER_ATTRIBUTES.toggle);
  }

  const styleAttribute =
    styles.length > 0 ? ` style="${styles.join(' ')}"` : '';

  return `<div ${attributes.join(' ')}${styleAttribute}>`;
};

// A raw HTML block in markdown ends at the first blank line, so what sits
// between the tags is still parsed as markdown.
const wrapMarkdown = (opening: string, markdown: string) =>
  `${opening}\n\n${markdown}\n\n</div>`;

const serializeBlocks = (editor: BlockNoteEditor, blocks: Block[]): string => {
  const parts: string[] = [];
  let run: PartialBlock[] = [];
  let lastNumber: number | null = null;

  const flushRun = () => {
    if (run.length > 0) {
      parts.push(editor.blocksToMarkdownLossy(run).trimEnd());
      run = [];
    }
  };

  for (const block of blocks) {
    const number: number | null =
      block.type === 'numberedListItem'
        ? (block.props.start ?? (isDefined(lastNumber) ? lastNumber + 1 : 1))
        : null;

    lastNumber = number;

    const isWrapped = needsPropertiesWrapper(block);
    const isPlain = !isWrapped && canMarkdownHoldChildren(block);
    const prepared = isPlain
      ? prepareBlockWithChildren(block)
      : prepareBlock(block);

    if (!isDefined(prepared)) {
      continue;
    }

    // Splitting a numbered list into separate markdown lists would restart its
    // count, so an item that starts a new list says where it is.
    const continuesList = isPlain && run.at(-1)?.type === 'numberedListItem';

    if (isDefined(number) && number !== 1 && !continuesList) {
      prepared.props = { ...prepared.props, start: number };
    }

    if (isPlain) {
      run.push(prepared);
      continue;
    }

    flushRun();

    const markdown = editor.blocksToMarkdownLossy([prepared]).trimEnd();

    parts.push(
      isWrapped
        ? wrapMarkdown(buildPropertiesWrapperOpening(block), markdown)
        : markdown,
    );

    if (block.children.length > 0) {
      parts.push(
        wrapMarkdown(
          `<div ${MARKDOWN_BLOCK_WRAPPER_ATTRIBUTES.children}>`,
          serializeBlocks(editor, block.children),
        ),
      );
    }
  }

  flushRun();

  return parts.join('\n\n');
};

// The editor always keeps an empty paragraph after the last block to type
// into, which is not content anyone wrote.
const dropTrailingEmptyParagraphs = (blocks: Block[]) => {
  let end = blocks.length;

  while (end > 0 && isEmptyParagraph(blocks[end - 1])) {
    end--;
  }

  return blocks.slice(0, end);
};

// What markdown has no syntax for (alignment, block colours, toggles, blocks
// nested under anything but a list item) goes out as a <div> around the
// markdown it applies to, which convertMarkdownToBlocks reads back.
export const convertBlocksToMarkdown = (
  editor: BlockNoteEditor,
  blocks: Block[],
): string => {
  const markdown = normalizeMarkdownHardBreaks(
    serializeBlocks(editor, dropTrailingEmptyParagraphs(blocks)),
  );

  return markdown === '' ? '' : `${markdown}\n`;
};
