import { type Block, type BlockNoteEditor } from '@blocknote/core';

import { MARKDOWN_BLOCK_WRAPPER_ATTRIBUTES } from '@/front-components/host-components/constants/MarkdownBlockWrapperAttributes';
import { convertMarkdownToHtml } from '@/front-components/host-components/utils/convertMarkdownToHtml';
import { normalizeMarkdownHardBreaks } from '@/front-components/host-components/utils/normalizeMarkdownHardBreaks';

// `\s` matches the non-breaking space an empty paragraph is written as.
const BLANK_TEXT = /^\s*$/;

// An empty paragraph is written as a lone non-breaking space so markdown keeps
// it; reading it back as text would leave a space to delete before typing.
const restoreEmptyParagraph = (block: Block): Block => {
  const children = block.children.map(restoreEmptyParagraph);

  if (
    block.type === 'paragraph' &&
    block.content.length > 0 &&
    block.content.every(
      (element) => element.type === 'text' && BLANK_TEXT.test(element.text),
    )
  ) {
    return { ...block, content: [], children };
  }

  return { ...block, children };
};

const isWrapper = (node: Node, attribute: string): node is Element =>
  node instanceof Element &&
  node.tagName === 'DIV' &&
  node.hasAttribute(attribute);

const applyWrapperProperties = (block: Block, wrapper: Element): Block => {
  const properties: Record<string, unknown> = { ...block.props };
  const textAlignment = wrapper.getAttribute('data-text-alignment');
  const textColor = wrapper.getAttribute('data-text-color');
  const backgroundColor = wrapper.getAttribute('data-background-color');

  if (textAlignment !== null && 'textAlignment' in properties) {
    properties.textAlignment = textAlignment;
  }

  if (textColor !== null && 'textColor' in properties) {
    properties.textColor = textColor;
  }

  if (backgroundColor !== null && 'backgroundColor' in properties) {
    properties.backgroundColor = backgroundColor;
  }

  if (!wrapper.hasAttribute(MARKDOWN_BLOCK_WRAPPER_ATTRIBUTES.toggle)) {
    return { ...block, props: properties } as Block;
  }

  if (block.type === 'bulletListItem') {
    return { ...block, type: 'toggleListItem', props: properties } as Block;
  }

  if ('isToggleable' in properties) {
    properties.isToggleable = true;
  }

  return { ...block, props: properties } as Block;
};

// BlockNote reads plain HTML into blocks; the wrapper <div>s
// convertBlocksToMarkdown writes are read here, around it: a properties
// wrapper sets what it carries on the block inside it, a children wrapper
// nests its blocks under the block before it.
const parseContainer = (
  editor: BlockNoteEditor,
  container: ParentNode,
): Block[] => {
  const blocks: Block[] = [];
  const pending = document.createElement('template');

  const flushPending = () => {
    if (pending.content.childNodes.length === 0) {
      return;
    }

    blocks.push(...editor.tryParseHTMLToBlocks(pending.innerHTML));
    pending.content.replaceChildren();
  };

  for (const node of Array.from(container.childNodes)) {
    if (isWrapper(node, MARKDOWN_BLOCK_WRAPPER_ATTRIBUTES.children)) {
      flushPending();

      const children = parseContainer(editor, node);
      const parent = blocks.at(-1);

      if (parent === undefined) {
        blocks.push(...children);
      } else {
        blocks[blocks.length - 1] = {
          ...parent,
          children: [...parent.children, ...children],
        };
      }

      continue;
    }

    if (isWrapper(node, MARKDOWN_BLOCK_WRAPPER_ATTRIBUTES.blockProperties)) {
      flushPending();
      blocks.push(
        ...parseContainer(editor, node).map((block) =>
          applyWrapperProperties(block, node),
        ),
      );
      continue;
    }

    pending.content.appendChild(node.cloneNode(true));
  }

  flushPending();

  return blocks;
};

export const convertMarkdownToBlocks = (
  editor: BlockNoteEditor,
  markdown: string,
): Block[] => {
  const template = document.createElement('template');

  template.innerHTML = convertMarkdownToHtml(
    normalizeMarkdownHardBreaks(markdown),
  );

  return parseContainer(editor, template.content).map(restoreEmptyParagraph);
};
