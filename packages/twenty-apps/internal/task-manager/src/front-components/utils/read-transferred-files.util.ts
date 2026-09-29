import type { TransferredFile } from './upload-image-from-transferred-file.util';

// `clipboardData.files` and `dataTransfer.files` are FileList-shaped but hold
// the host's stand-ins, not File objects — the bytes stayed on the host — so
// the entries are read structurally rather than typed as File.
export const readTransferredFiles = (transfer: unknown): TransferredFile[] => {
  if (typeof transfer !== 'object' || transfer === null) {
    return [];
  }

  const files = (transfer as { files?: unknown }).files;

  if (typeof files !== 'object' || files === null) {
    return [];
  }

  const fileListLike = files as { length?: unknown } & Record<number, unknown>;

  if (typeof fileListLike.length !== 'number') {
    return [];
  }

  const transferredFiles: TransferredFile[] = [];

  for (let index = 0; index < fileListLike.length; index++) {
    const file = fileListLike[index];

    if (typeof file !== 'object' || file === null) {
      continue;
    }

    const fileRecord = file as Record<string, unknown>;

    if (
      typeof fileRecord.name !== 'string' ||
      typeof fileRecord.size !== 'number' ||
      typeof fileRecord.type !== 'string'
    ) {
      continue;
    }

    transferredFiles.push({
      name: fileRecord.name,
      size: fileRecord.size,
      type: fileRecord.type,
      handle:
        typeof fileRecord.handle === 'string' ? fileRecord.handle : undefined,
    });
  }

  return transferredFiles;
};
