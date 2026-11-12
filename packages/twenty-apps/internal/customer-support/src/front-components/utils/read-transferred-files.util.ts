export type TransferredFile = {
  name: string;
  size: number;
  type: string;
  handle: string;
};

// `files` on an input, clipboard or drop event holds the host's stand-ins, not
// File objects: the bytes stay on the host behind a single-use `handle`.
export const readTransferredFiles = (transfer: unknown): TransferredFile[] => {
  const files = (transfer as { files?: unknown } | null)?.files;
  const fileListLike = files as
    ({ length?: unknown } & Record<number, unknown>) | null | undefined;

  if (
    typeof fileListLike !== 'object' ||
    fileListLike === null ||
    typeof fileListLike.length !== 'number'
  ) {
    return [];
  }

  const transferredFiles: TransferredFile[] = [];

  for (let index = 0; index < fileListLike.length; index++) {
    const file = fileListLike[index] as Record<string, unknown> | null;

    if (
      typeof file?.name === 'string' &&
      typeof file.size === 'number' &&
      typeof file.type === 'string' &&
      typeof file.handle === 'string' &&
      file.handle.length > 0
    ) {
      transferredFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        handle: file.handle,
      });
    }
  }

  return transferredFiles;
};
