import { isDefined } from 'twenty-shared/utils';

// A pasted or dropped File never crosses the postMessage bridge: its bytes
// would have to be cloned into the sandbox for every paste, and the event
// serializer runs synchronously so it could not await them anyway. The real
// File stays here and the sandbox receives an unguessable handle it spends
// through uploadFileByHandle.
//
// Eviction rule: a handle is single use — taking it removes it — and it is
// dropped after TRANSFERRED_FILE_TTL_MS or once MAX_TRANSFERRED_FILES newer
// files have pushed it out, whichever comes first. Expired entries are swept
// on every stash and every take, so a file the sandbox never claims cannot
// pin its bytes in memory.
const MAX_TRANSFERRED_FILES = 8;
const TRANSFERRED_FILE_TTL_MS = 60_000;

type TransferredFile = {
  file: File;
  stashedAt: number;
};

const transferredFileByHandle = new Map<string, TransferredFile>();

const evictExpiredTransferredFiles = (now: number): void => {
  for (const [handle, transferredFile] of transferredFileByHandle) {
    if (now - transferredFile.stashedAt > TRANSFERRED_FILE_TTL_MS) {
      transferredFileByHandle.delete(handle);
    }
  }
};

export const stashTransferredFile = (file: File): string => {
  const now = Date.now();

  evictExpiredTransferredFiles(now);

  // A Map iterates in insertion order, so the first key is the oldest handle.
  while (transferredFileByHandle.size >= MAX_TRANSFERRED_FILES) {
    const oldestHandle = transferredFileByHandle.keys().next().value;

    if (!isDefined(oldestHandle)) {
      break;
    }

    transferredFileByHandle.delete(oldestHandle);
  }

  const handle = crypto.randomUUID();

  transferredFileByHandle.set(handle, { file, stashedAt: now });

  return handle;
};

export const takeTransferredFile = (handle: string): File | undefined => {
  evictExpiredTransferredFiles(Date.now());

  const transferredFile = transferredFileByHandle.get(handle);

  transferredFileByHandle.delete(handle);

  return transferredFile?.file;
};
