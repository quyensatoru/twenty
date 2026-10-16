export type IssueAttachmentRow = {
  fileId: string;
  label: string;
  extension?: string | null;
  url?: string | null;
};

// The API does not always fill extension in, so the widget falls back to the
// suffix of the file name rather than leaving the chip blank.
export const readAttachmentExtension = (fileName: string): string | null => {
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return null;
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
};

// The FILES value off the issue-detail route, normalized for the Attachments
// widget. The API types every entry, but a row the list cannot name is still
// renderable under its id, and anything that is not a row at all is dropped
// rather than crashing the panel.
export const readIssueAttachments = (value: unknown): IssueAttachmentRow[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const rows: IssueAttachmentRow[] = [];

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }

    const { fileId, label, extension, url } = entry as Record<string, unknown>;

    if (typeof fileId !== 'string' || fileId === '') {
      continue;
    }

    rows.push({
      fileId,
      label: typeof label === 'string' && label !== '' ? label : fileId,
      extension: typeof extension === 'string' ? extension : null,
      url: typeof url === 'string' ? url : null,
    });
  }

  return rows;
};

export type AttachmentKind = 'image' | 'pdf' | 'code' | 'other';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);
const CODE_EXTENSIONS = new Set([
  'json',
  'js',
  'jsx',
  'ts',
  'tsx',
  'html',
  'css',
  'xml',
  'yml',
  'yaml',
  'sql',
  'sh',
  'py',
  'rb',
  'go',
  'java',
  'php',
  'csv',
  'log',
  'md',
]);

// The extension decides how a file is drawn: an image as a thumbnail, the
// rest as a tile colored by kind.
export const readAttachmentKind = (row: IssueAttachmentRow): AttachmentKind => {
  const extension = readAttachmentRowExtension(row);

  if (extension === null) {
    return 'other';
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return 'image';
  }

  if (extension === 'pdf') {
    return 'pdf';
  }

  return CODE_EXTENSIONS.has(extension) ? 'code' : 'other';
};

export const readAttachmentRowExtension = (
  row: IssueAttachmentRow,
): string | null => {
  const extension =
    typeof row.extension === 'string'
      ? row.extension.replace(/^\./, '').toLowerCase()
      : '';

  return extension === '' ? readAttachmentExtension(row.label) : extension;
};
