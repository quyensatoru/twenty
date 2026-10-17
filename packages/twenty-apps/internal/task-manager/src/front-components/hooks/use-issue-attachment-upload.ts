import { useRef, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { appendIssueAttachment } from '../utils/append-issue-attachment.util';
import { resolveAttachmentFieldMetadataId } from '../utils/resolve-attachment-field-metadata-id.util';
import { uploadFileByHandle } from '../utils/upload-file-by-handle.util';
import { type TransferredFile } from '../utils/upload-file-from-transferred-file.util';

type UseIssueAttachmentUploadParams = {
  issueId: string;
  onUploaded: () => void;
};

// Picked or dropped files, stored by the host and then filed on the issue's
// Attachments field: the same two steps a pasted image takes, for any file.
export const useIssueAttachmentUpload = ({
  issueId,
  onUploaded,
}: UseIssueAttachmentUploadParams) => {
  const [uploadingCount, setUploadingCount] = useState(0);

  const uploadFiles = async (files: TransferredFile[]) => {
    const uploadableFiles = files.filter(
      (file) =>
        typeof file.handle === 'string' && file.handle !== '' && file.size > 0,
    );

    if (uploadableFiles.length === 0) {
      return;
    }

    const fieldMetadataId = await resolveAttachmentFieldMetadataId();

    if (fieldMetadataId === null) {
      void enqueueSnackbar({
        message: t(
          'The Attachments field is missing, so the file could not be stored.',
        ),
        variant: 'warning',
      });

      return;
    }

    setUploadingCount((count) => count + uploadableFiles.length);

    const outcomes = await Promise.all(
      uploadableFiles.map(async (file) => {
        try {
          const result = await uploadFileByHandle(file.handle ?? '', {
            fieldMetadataId,
            fileName: file.name,
          });

          if (result.status !== 'uploaded') {
            return false;
          }

          await appendIssueAttachment(issueId, {
            fileId: result.file.fileId,
            label: file.name,
          });

          return true;
        } catch {
          return false;
        } finally {
          setUploadingCount((count) => count - 1);
        }
      }),
    );

    const failedCount = outcomes.filter((isStored) => !isStored).length;

    if (failedCount > 0) {
      void enqueueSnackbar({
        message:
          failedCount === 1
            ? t('A file could not be attached.')
            : t('{failedCount} files could not be attached.', { failedCount }),
        variant: 'warning',
      });
    }

    if (failedCount < uploadableFiles.length) {
      onUploaded();
    }
  };

  // The sandbox can keep the first handler an element was given, so the
  // element calls through a ref that always holds this render's function.
  // oxlint-disable-next-line twenty/no-state-useref
  const uploadFilesRef = useRef(uploadFiles);
  uploadFilesRef.current = uploadFiles;

  return {
    isUploading: uploadingCount > 0,
    uploadFilesRef,
  };
};
