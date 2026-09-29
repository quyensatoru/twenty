import { isNumber, isObject } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { stashTransferredFile } from '@/host/events/utils/transferredFileStash';
import { type SerializedFileData } from '@/types/SerializedFileData';

const EVENT_TYPE_TO_TRANSFER_KEY: Record<string, string> = {
  paste: 'clipboardData',
  drop: 'dataTransfer',
};

// Only metadata is read here, which is synchronous — the serializer runs in the
// same tick as the DOM event and cannot await `file.arrayBuffer()`. The bytes
// stay on the host behind the returned handle.
export const serializeTransferredFileList = (
  domEvent: Record<string, unknown>,
  eventType: string,
): SerializedFileData[] | undefined => {
  const transferKey = EVENT_TYPE_TO_TRANSFER_KEY[eventType];

  if (!isDefined(transferKey)) {
    return undefined;
  }

  const transfer = domEvent[transferKey];

  if (!isObject(transfer)) {
    return undefined;
  }

  const files = (transfer as Record<string, unknown>).files;

  if (!isObject(files)) {
    return undefined;
  }

  const fileListLike = files as { length?: unknown } & Record<number, unknown>;

  if (!isNumber(fileListLike.length)) {
    return undefined;
  }

  const serialized: SerializedFileData[] = [];

  for (let index = 0; index < fileListLike.length; index++) {
    const file = fileListLike[index];

    // Only a real host File can be stashed: a handle must never name anything
    // the user did not just paste or drop.
    if (!(file instanceof File)) {
      continue;
    }

    serialized.push({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      handle: stashTransferredFile(file),
    });
  }

  return serialized.length === 0 ? undefined : serialized;
};
