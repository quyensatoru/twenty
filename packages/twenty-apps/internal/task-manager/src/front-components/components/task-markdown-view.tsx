import { type ReactNode } from 'react';

import {
  type MarkdownBlock,
  type MarkdownInlineNode,
} from '../../types/markdown-node';
import { parseMarkdownBlocks } from '../../utils/parse-markdown-blocks.util';
import { TASK_TOKENS } from './task-tokens';

type TaskMarkdownViewProps = {
  markdown: string;
  emptyText?: string;
};

const CODE_FONT_FAMILY =
  'var(--t-code-font-family, ui-monospace, SFMono-Regular, Menlo, monospace)';

const INLINE_CODE_STYLE = {
  background: TASK_TOKENS.backgroundTertiary,
  borderRadius: TASK_TOKENS.radiusSmall,
  fontFamily: CODE_FONT_FAMILY,
  fontSize: 12,
  padding: '1px 4px',
} as const;

const HEADING_FONT_SIZE_BY_LEVEL = { 1: 18, 2: 16, 3: 14 } as const;

const renderInline = (
  nodes: MarkdownInlineNode[],
  keyPrefix: string,
): ReactNode[] =>
  nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (node.type === 'image') {
      return (
        <img
          key={key}
          src={node.url}
          alt={node.alt}
          style={{
            borderRadius: TASK_TOKENS.radiusSmall,
            display: 'block',
            maxWidth: '100%',
          }}
        />
      );
    }

    if (node.type === 'link') {
      return (
        <a
          key={key}
          href={node.url}
          target="_blank"
          rel="noreferrer noopener"
          style={{ color: TASK_TOKENS.accent, textDecoration: 'underline' }}
        >
          {node.text}
        </a>
      );
    }

    if (node.styles.isCode) {
      return (
        <code key={key} style={INLINE_CODE_STYLE}>
          {node.text}
        </code>
      );
    }

    return (
      <span
        key={key}
        style={{
          fontStyle: node.styles.isItalic ? 'italic' : 'normal',
          fontWeight: node.styles.isBold ? 600 : 400,
        }}
      >
        {node.text}
      </span>
    );
  });

const renderBlock = (block: MarkdownBlock, key: string): ReactNode => {
  switch (block.type) {
    case 'heading':
      return (
        <div
          key={key}
          style={{
            color: TASK_TOKENS.textPrimary,
            fontSize: HEADING_FONT_SIZE_BY_LEVEL[block.level],
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          {renderInline(block.content, key)}
        </div>
      );
    case 'bulletListItem':
    case 'numberedListItem':
      return (
        <div key={key} style={{ display: 'flex', gap: 6 }}>
          <span style={{ color: TASK_TOKENS.textTertiary, flexShrink: 0 }}>
            {block.type === 'bulletListItem' ? '•' : '1.'}
          </span>
          <span>{renderInline(block.content, key)}</span>
        </div>
      );
    case 'quote':
      return (
        <div
          key={key}
          style={{
            borderLeft: `2px solid ${TASK_TOKENS.borderStrong}`,
            color: TASK_TOKENS.textSecondary,
            paddingLeft: 8,
          }}
        >
          {renderInline(block.content, key)}
        </div>
      );
    case 'codeBlock':
      return (
        <pre
          key={key}
          style={{
            background: TASK_TOKENS.backgroundTertiary,
            borderRadius: TASK_TOKENS.radiusSmall,
            fontFamily: CODE_FONT_FAMILY,
            fontSize: 12,
            margin: 0,
            overflowX: 'auto',
            padding: 8,
          }}
        >
          {block.code}
        </pre>
      );
    case 'image':
      return (
        <img
          key={key}
          src={block.url}
          alt={block.alt}
          style={{
            borderRadius: TASK_TOKENS.radiusSmall,
            display: 'block',
            maxWidth: '100%',
          }}
        />
      );
    case 'divider':
      return (
        <hr
          key={key}
          style={{
            border: 'none',
            borderTop: `1px solid ${TASK_TOKENS.border}`,
            margin: '4px 0',
            width: '100%',
          }}
        />
      );
    case 'paragraph':
      return (
        <div key={key} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {renderInline(block.content, key)}
        </div>
      );
  }
};

// Renders the markdown half of a stored value. The host's BlockNote cannot run
// in the sandbox, so what a comment looks like after it is saved is drawn here
// from the same block model the composer's preview uses.
export const TaskMarkdownView = ({
  markdown,
  emptyText,
}: TaskMarkdownViewProps) => {
  const blocks = parseMarkdownBlocks(markdown);

  if (blocks.length === 0) {
    return emptyText === undefined ? null : (
      <span
        style={{
          color: TASK_TOKENS.textTertiary,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
        }}
      >
        {emptyText}
      </span>
    );
  }

  return (
    <div
      style={{
        color: TASK_TOKENS.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        gap: 6,
        lineHeight: 1.5,
      }}
    >
      {blocks.map((block, index) => renderBlock(block, `block-${index}`))}
    </div>
  );
};
