import { type SyntheticEvent } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { linkifyPreviewMarkdown } from '../utils/linkify-preview-markdown.util';
import { TASK_TOKENS } from './task-tokens';

type TaskRichTextPreviewProps = {
  value: string;
};

const stopLinkEventPropagation = (event: SyntheticEvent) => {
  event.stopPropagation();
};

export const TaskRichTextPreview = ({ value }: TaskRichTextPreviewProps) => (
  <div
    style={{
      color: TASK_TOKENS.textPrimary,
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      lineHeight: '1.6',
      minWidth: 0,
      overflowWrap: 'anywhere',
      userSelect: 'text',
      width: '100%',
    }}
  >
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, href, title }) => (
          <a
            href={href}
            title={title}
            target="_blank"
            rel="noopener noreferrer"
            // The description enters edit mode on mousedown or Enter.
            onMouseDown={stopLinkEventPropagation}
            onClick={stopLinkEventPropagation}
            onKeyDown={stopLinkEventPropagation}
            style={{ color: TASK_TOKENS.accent, cursor: 'pointer' }}
          >
            {children}
          </a>
        ),
        p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
        img: ({ src, alt, title }) => (
          <img
            src={src}
            alt={alt}
            title={title}
            style={{ borderRadius: TASK_TOKENS.radiusSmall, maxWidth: '100%' }}
          />
        ),
        pre: ({ children }) => (
          <pre
            style={{
              background: TASK_TOKENS.backgroundSecondary,
              borderRadius: TASK_TOKENS.radiusSmall,
              overflowX: 'auto',
              padding: 8,
            }}
          >
            {children}
          </pre>
        ),
      }}
    >
      {linkifyPreviewMarkdown(value)}
    </Markdown>
  </div>
);
