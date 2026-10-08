import { isObject } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { type SerializedEventData } from '@/types/SerializedEventData';
import { type SerializedFileData } from '@/types/SerializedFileData';

// The bytes never left the host, so these stand in for the File objects: app
// code reads name/size/type as it would on a real FileList and spends `handle`
// through uploadFileByHandle to have the host upload the file it kept.
const buildFileListLike = (
  files: SerializedFileData[],
): SerializedFileData[] & {
  item: (index: number) => SerializedFileData | null;
} =>
  Object.assign([...files], {
    item: (index: number) => files[index] ?? null,
  });

export const applySerializedEventTransferredFiles = (
  event: Record<string, unknown>,
  eventData: SerializedEventData,
): void => {
  const files = eventData.files;

  if (!isDefined(files) || files.length === 0) {
    return;
  }

  if (eventData.type === 'paste') {
    const clipboardData = event.clipboardData;

    if (!isObject(clipboardData)) {
      return;
    }

    const clipboardDataRecord = clipboardData as Record<string, unknown>;
    const types = clipboardDataRecord.types;

    clipboardDataRecord.files = buildFileListLike(files);
    clipboardDataRecord.types = [
      ...(Array.isArray(types) ? (types as string[]) : []),
      'Files',
    ];

    return;
  }

  // A host component's upload arrives as a plain Event, which has no detail
  // of its own, while the SDK contract reads `event.detail.files`.
  if (eventData.type === 'upload') {
    Object.defineProperty(event, 'detail', {
      value: { files: buildFileListLike(files) },
      configurable: true,
      enumerable: true,
      writable: true,
    });

    return;
  }

  if (eventData.type === 'drop') {
    event.dataTransfer = {
      files: buildFileListLike(files),
      items: [],
      types: ['Files'],
      getData: () => '',
      setData: () => undefined,
    };
  }
};
