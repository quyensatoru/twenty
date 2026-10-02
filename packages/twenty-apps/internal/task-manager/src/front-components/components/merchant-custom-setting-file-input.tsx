import { type ChangeEvent, type DragEvent, type ClipboardEvent, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconFile, IconX } from 'twenty-ui/icon';

import { type CustomSettingFileValue } from '../../types/custom-setting-schema';
import {
  buildCustomSettingFileValue,
  formatCustomSettingFileName,
} from '../../utils/build-custom-setting-file-value.util';
import {
  isUploadFileByHandleAvailable,
  uploadFileByHandle,
} from '../utils/upload-file-by-handle.util';
import { type TransferredFile } from '../utils/upload-image-from-transferred-file.util';
import { TaskIconButton } from './task-icon-button';
import { TASK_TOKENS } from './task-tokens';

const DROP_ZONE_HEIGHT = 64;

type MerchantCustomSettingFileInputProps = {
  value: CustomSettingFileValue | null;
  onChange: (value: CustomSettingFileValue | null) => void;
  ariaLabel: string;
  uploadFieldMetadataId: string | null;
};

const readFirstTransferredFile = (
  files: unknown,
): TransferredFile | undefined => {
  if (!Array.isArray(files)) {
    return undefined;
  }

  return files.find(
    (file: TransferredFile) =>
      typeof file?.handle === 'string' && file.handle.length > 0,
  );
};

// Drag, drop, paste, or a native file picker. The zone itself is a <label>
// wrapping a hidden <input type="file">: activating a label's control is
// browser-native behaviour, needing no click() forwarded through the sandbox
// bridge — the host renders both as real elements and the OS dialog opens
// without the guest ever being involved in opening it, only in handling the
// `change` it fires back. That `change` carries the same single-use `handle`
// a drop or paste does, so the upload path below is shared by all three.
export const MerchantCustomSettingFileInput = ({
  value,
  onChange,
  ariaLabel,
  uploadFieldMetadataId,
}: MerchantCustomSettingFileInputProps) => {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const acceptTransferredFiles = async (files: unknown) => {
    const file = readFirstTransferredFile(files);

    if (file === undefined) {
      setUploadError(t('That is not a file this page can take.'));

      return;
    }

    if (!isUploadFileByHandleAvailable() || uploadFieldMetadataId === null) {
      setUploadError(t('Uploading is not available on this workspace.'));

      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadFileByHandle(file.handle ?? '', {
        fieldMetadataId: uploadFieldMetadataId,
        fileName: file.name,
      });

      if (result.status !== 'uploaded') {
        setUploadError(t('The upload failed.'));

        return;
      }

      onChange(
        buildCustomSettingFileValue({
          fileId: result.file.fileId,
          fileName: file.name,
          url: result.file.url,
        }),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    // The host has its own drop handling further up the page; without this the
    // same file would be taken twice, once here and once by whatever is behind
    // the overlay.
    event.stopPropagation();
    setIsDraggedOver(false);
    acceptTransferredFiles(event.dataTransfer?.files);
  };

  const handlePaste = (event: ClipboardEvent<HTMLLabelElement>) => {
    const files = event.clipboardData?.files;

    if (readFirstTransferredFile(files) === undefined) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    acceptTransferredFiles(files);
  };

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    acceptTransferredFiles(event.target.files);
    // So picking the same file a second time still fires `change`.
    event.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        // Focusable so a paste lands here rather than on the page behind it.
        tabIndex={0}
        aria-label={ariaLabel}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDraggedOver(true);
        }}
        onDragLeave={() => setIsDraggedOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        style={{
          alignItems: 'center',
          background: isDraggedOver
            ? TASK_TOKENS.accentSoft
            : TASK_TOKENS.backgroundTransparentLighter,
          border: `1px dashed ${
            isDraggedOver ? TASK_TOKENS.accent : TASK_TOKENS.borderStrong
          }`,
          borderRadius: TASK_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: TASK_TOKENS.textTertiary,
          cursor: 'pointer',
          display: 'flex',
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          height: DROP_ZONE_HEIGHT,
          justifyContent: 'center',
          outline: 'none',
          textAlign: 'center',
          width: '100%',
        }}
      >
        {isUploading
          ? t('Uploading…')
          : t('Drop a file, paste it, or click to choose')}
        <input
          type="file"
          onChange={handlePick}
          style={{ display: 'none' }}
        />
      </label>

      {value === null ? null : (
        <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
          <IconFile size={14} color={TASK_TOKENS.textTertiary} />
          <span
            style={{
              color: TASK_TOKENS.textPrimary,
              flex: 1,
              fontSize: 13,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formatCustomSettingFileName(value)}
          </span>
          <TaskIconButton label={t('Remove')} onClick={() => onChange(null)}>
            <IconX size={14} />
          </TaskIconButton>
        </div>
      )}

      {uploadError === null ? null : (
        <span style={{ color: TASK_TOKENS.textDanger, fontSize: 12 }}>
          {uploadError}
        </span>
      )}
    </div>
  );
};
