import { stashTransferredFile } from '@/host/events/utils/transferredFileStash';
import { type SerializedFileData } from '@/types/SerializedFileData';

// Only metadata crosses the bridge. The bytes stay on the host behind the
// handle, which the guest spends through uploadFileByHandle.
export const serializeTransferredFile = (file: File): SerializedFileData => ({
  name: file.name,
  size: file.size,
  type: file.type,
  lastModified: file.lastModified,
  handle: stashTransferredFile(file),
});
