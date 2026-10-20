import { type MessageAttachment } from '../../types/moments-records';

export type AttachmentKind = 'image' | 'video' | 'file';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'svg']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v', 'ogv']);

export const readFileExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');

  return dotIndex <= 0 ? '' : fileName.slice(dotIndex + 1).toLowerCase();
};

export const readAttachmentKind = (attachment: MessageAttachment): AttachmentKind => {
  const extension = (attachment.extension ?? readFileExtension(attachment.label)).replace(/^\./, '').toLowerCase();

  if (IMAGE_EXTENSIONS.has(extension)) {
    return 'image';
  }

  return VIDEO_EXTENSIONS.has(extension) ? 'video' : 'file';
};
