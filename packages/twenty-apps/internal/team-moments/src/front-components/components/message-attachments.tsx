import { IconFile } from 'twenty-ui/icon';

import { type MessageAttachment } from '../../types/moments-records';
import { readAttachmentKind } from '../utils/read-attachment-kind.util';
import { MOMENTS_TOKENS } from './moments-tokens';

type MessageAttachmentsProps = {
  attachments: MessageAttachment[];
};

// Images and GIFs render inline (a GIF keeps animating in an <img>), videos
// get native controls, anything else is a link that opens the file.
export const MessageAttachments = ({ attachments }: MessageAttachmentsProps) => {
  const withUrl = attachments.filter((attachment) => typeof attachment.url === 'string' && attachment.url.length > 0);

  if (withUrl.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {withUrl.map((attachment) => {
        const url = attachment.url ?? '';
        const kind = readAttachmentKind(attachment);

        if (kind === 'image') {
          return (
            <a key={attachment.fileId} href={url} target="_blank" rel="noopener noreferrer" style={{ borderRadius: 10, display: 'block', lineHeight: 0, overflow: 'hidden' }}>
              <img src={url} alt={attachment.label} style={{ borderRadius: 10, display: 'block', maxHeight: 260, maxWidth: 320, objectFit: 'cover' }} />
            </a>
          );
        }

        if (kind === 'video') {
          return (
            <video key={attachment.fileId} src={url} controls muted playsInline style={{ background: '#000000', borderRadius: 10, maxHeight: 260, maxWidth: 360 }} />
          );
        }

        return (
          <a
            key={attachment.fileId}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ alignItems: 'center', border: `1px solid ${MOMENTS_TOKENS.border}`, borderRadius: 8, color: MOMENTS_TOKENS.textPrimary, display: 'inline-flex', fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 13, gap: 6, padding: '6px 10px', textDecoration: 'none' }}
          >
            <IconFile size={14} />
            {attachment.label}
          </a>
        );
      })}
    </div>
  );
};
