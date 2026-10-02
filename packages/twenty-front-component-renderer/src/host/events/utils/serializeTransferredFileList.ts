import { isNumber, isObject } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { serializeTransferredFile } from '@/host/events/utils/serializeTransferredFile';
import { type SerializedFileData } from '@/types/SerializedFileData';

const EVENT_TYPE_TO_TRANSFER_KEY: Record<string, string> = {
  paste: 'clipboardData',
  drop: 'dataTransfer',
};

// A real file picker is a third way a File reaches the host, alongside paste
// and drop: `change` on an <input type="file"> carries its FileList straight
// on `event.target`, not behind a transfer object keyed by event type, so it
// is resolved on its own rather than added to the map above.
const resolveFileListLike = (
  domEvent: Record<string, unknown>,
  eventType: string,
): unknown => {
  const transferKey = EVENT_TYPE_TO_TRANSFER_KEY[eventType];

  if (isDefined(transferKey)) {
    const transfer = domEvent[transferKey];

    return isObject(transfer)
      ? (transfer as Record<string, unknown>).files
      : undefined;
  }

  if (eventType === 'change') {
    const target = domEvent.target;

    return isObject(target)
      ? (target as Record<string, unknown>).files
      : undefined;
  }

  return undefined;
};

// Only metadata is read here, which is synchronous — the serializer runs in the
// same tick as the DOM event and cannot await `file.arrayBuffer()`. The bytes
// stay on the host behind the returned handle.
export const serializeTransferredFileList = (
  domEvent: Record<string, unknown>,
  eventType: string,
): SerializedFileData[] | undefined => {
  const files = resolveFileListLike(domEvent, eventType);

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
    // the user did not just paste, drop, or pick.
    if (!(file instanceof File)) {
      continue;
    }

    serialized.push(serializeTransferredFile(file));
  }

  return serialized.length === 0 ? undefined : serialized;
};
