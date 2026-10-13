import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconDownload, IconFile, IconMicrophone } from 'twenty-ui/icon';

import { type SupportInboxMessage } from '../../types/support-inbox';
import {
  type InlineMarkdownNode,
  parseInlineMarkdown,
} from '../utils/parse-inline-markdown.util';
import { ImageLightbox } from './image-lightbox';
import { INBOX_TOKENS } from './inbox-tokens';

type MessageContentProps = {
  message: SupportInboxMessage;
  isOutgoing: boolean;
};

type FileContent = { name?: string; url?: string; type?: string };

const readFileContent = (content: unknown): FileContent =>
  typeof content === 'object' && content !== null
    ? (content as FileContent)
    : {};

// A screenshot pasted into a note (![image.png](url)): shown as a thumbnail
// that zooms in place, never as a link that downloads the file.
const InlineImage = ({ url, alt }: { url: string; alt: string }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={t('Zoom image')}
        onClick={() => setIsZoomed(true)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'zoom-in',
          display: 'block',
          margin: '6px 0',
          padding: 0,
        }}
      >
        <img
          src={url}
          alt={alt}
          style={{
            border: `1px solid ${INBOX_TOKENS.borderLight}`,
            borderRadius: 10,
            display: 'block',
            maxHeight: 220,
            maxWidth: '100%',
            objectFit: 'cover',
          }}
        />
      </button>
      {isZoomed && (
        <ImageLightbox url={url} alt={alt} onClose={() => setIsZoomed(false)} />
      )}
    </>
  );
};

export const InlineMarkdown = ({
  nodes,
  linkColor,
  isOutgoing,
}: {
  nodes: InlineMarkdownNode[];
  linkColor: string;
  isOutgoing: boolean;
}) => (
  <>
    {nodes.map((node, index) => {
      switch (node.type) {
        case 'bold':
          return (
            <strong key={index} style={{ fontWeight: 650 }}>
              <InlineMarkdown
                nodes={node.children}
                linkColor={linkColor}
                isOutgoing={isOutgoing}
              />
            </strong>
          );
        case 'italic':
          return (
            <em key={index}>
              <InlineMarkdown
                nodes={node.children}
                linkColor={linkColor}
                isOutgoing={isOutgoing}
              />
            </em>
          );
        case 'code':
          return (
            <code
              key={index}
              style={{
                background: isOutgoing
                  ? 'rgba(255,255,255,.18)'
                  : INBOX_TOKENS.backgroundTertiary,
                borderRadius: 5,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.92em',
                padding: '1px 5px',
              }}
            >
              {node.text}
            </code>
          );
        case 'link':
          return (
            <a
              key={index}
              href={node.url}
              target="_blank"
              rel="noreferrer"
              style={{
                color: linkColor,
                textDecoration: 'underline',
                textUnderlineOffset: 2,
                wordBreak: 'break-all',
              }}
            >
              {node.text}
            </a>
          );
        case 'image':
          return <InlineImage key={index} url={node.url} alt={node.alt} />;
        default:
          return <span key={index}>{node.text}</span>;
      }
    })}
  </>
);

export const MessageContent = ({
  message,
  isOutgoing,
}: MessageContentProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const linkColor = isOutgoing
    ? INBOX_TOKENS.textInverted
    : INBOX_TOKENS.accent;

  if (message.messageType === 'file' || message.messageType === 'animation') {
    const file = readFileContent(message.content);
    const isImage =
      message.messageType === 'animation' ||
      (typeof file.type === 'string' && file.type.startsWith('image/'));

    if (isImage && typeof file.url === 'string') {
      const imageUrl = file.url;

      return (
        <>
          <button
            type="button"
            aria-label={t('Zoom image')}
            onClick={() => setIsZoomed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'zoom-in',
              display: 'block',
              padding: 0,
            }}
          >
            <img
              src={imageUrl}
              alt={file.name ?? ''}
              style={{
                borderRadius: 12,
                display: 'block',
                maxHeight: 260,
                maxWidth: '100%',
                objectFit: 'cover',
              }}
            />
          </button>
          {isZoomed && (
            <ImageLightbox
              url={imageUrl}
              alt={file.name ?? ''}
              onClose={() => setIsZoomed(false)}
            />
          )}
        </>
      );
    }

    return (
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        style={{
          alignItems: 'center',
          color: 'inherit',
          display: 'flex',
          gap: 10,
          minWidth: 180,
          textDecoration: 'none',
        }}
      >
        <span
          style={{
            alignItems: 'center',
            background: isOutgoing
              ? 'rgba(255,255,255,.18)'
              : INBOX_TOKENS.backgroundTertiary,
            borderRadius: 10,
            display: 'inline-flex',
            flexShrink: 0,
            height: 36,
            justifyContent: 'center',
            width: 36,
          }}
        >
          <IconFile size={18} />
        </span>
        <span
          style={{
            flex: 1,
            fontWeight: 500,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {file.name ?? message.text ?? t('File')}
        </span>
        <IconDownload size={16} />
      </a>
    );
  }

  if (message.messageType === 'audio') {
    const file = readFileContent(message.content);

    return (
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        style={{
          alignItems: 'center',
          color: 'inherit',
          display: 'inline-flex',
          gap: 8,
          textDecoration: 'none',
        }}
      >
        <IconMicrophone size={16} />
        {t('Voice message')}
      </a>
    );
  }

  return (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      <InlineMarkdown
        nodes={parseInlineMarkdown(message.text ?? '')}
        linkColor={linkColor}
        isOutgoing={isOutgoing}
      />
    </span>
  );
};
