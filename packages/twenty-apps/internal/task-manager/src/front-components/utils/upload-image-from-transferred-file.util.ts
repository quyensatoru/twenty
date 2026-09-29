import { resolveAttachmentFieldMetadataId } from './resolve-attachment-field-metadata-id.util';
import {
  isUploadFileByHandleAvailable,
  uploadFileByHandle,
} from './upload-file-by-handle.util';

// The shape the host puts on `clipboardData.files` / `dataTransfer.files`:
// the metadata of the file the user handed over, plus the handle that stands
// in for its bytes.
export type TransferredFile = {
  name: string;
  size: number;
  type: string;
  handle?: string;
};

// Not named `reason`: the translation extractor treats `reason: '...'` as a
// user-facing message and would add these discriminants to the catalogs.
export type UploadImageFromTransferredFileFailure =
  | 'host-too-old'
  | 'no-attachment-field'
  | 'upload-failed';

export type UploadImageFromTransferredFileResult =
  | { status: 'uploaded'; url: string; name: string }
  | { status: 'failed'; failure: UploadImageFromTransferredFileFailure };

export const isTransferredImageFile = (file: TransferredFile): boolean =>
  typeof file.handle === 'string' &&
  file.handle !== '' &&
  file.size > 0 &&
  file.type.startsWith('image/');

export const uploadImageFromTransferredFile = async (
  file: TransferredFile,
): Promise<UploadImageFromTransferredFileResult> => {
  if (!isUploadFileByHandleAvailable()) {
    return { status: 'failed', failure: 'host-too-old' };
  }

  const fieldMetadataId = await resolveAttachmentFieldMetadataId();

  if (fieldMetadataId === null) {
    return { status: 'failed', failure: 'no-attachment-field' };
  }

  const result = await uploadFileByHandle(file.handle ?? '', {
    fieldMetadataId,
    fileName: file.name,
  });

  if (result.status !== 'uploaded') {
    return { status: 'failed', failure: 'upload-failed' };
  }

  return { status: 'uploaded', url: result.file.url, name: file.name };
};
