import { type ChangeEvent, useState } from 'react';
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

// Click to choose, nothing else: a <label> wrapping a hidden
// <input type="file">, so the OS dialog opens through browser-native
// behaviour with no click() forwarded through the sandbox bridge —
// `HtmlInputElement` exposes no methods in remote-elements. The picked file
// arrives with the single-use handle uploadFileByHandle spends.
export const MerchantCustomSettingFileInput = ({
  value,
  onChange,
  ariaLabel,
  uploadFieldMetadataId,
}: MerchantCustomSettingFileInputProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isDisabled = isUploading;

  const handlePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = readFirstTransferredFile(event.target.files);
    // So picking the same file a second time still fires `change`.
    event.target.value = '';

    if (file === undefined) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
        <label
          aria-label={ariaLabel}
          aria-disabled={isDisabled}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            alignItems: 'center',
            background: isHovered && !isDisabled
              ? TASK_TOKENS.backgroundHover
              : TASK_TOKENS.background,
            border: `1px solid ${TASK_TOKENS.border}`,
            borderRadius: TASK_TOKENS.radiusSmall,
            boxSizing: 'border-box',
            color: TASK_TOKENS.textSecondary,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            flexShrink: 0,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            fontWeight: 500,
            height: 32,
            justifyContent: 'center',
            opacity: isDisabled ? 0.5 : 1,
            padding: '0 12px',
            pointerEvents: isDisabled ? 'none' : 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {isUploading
            ? t('Uploading…')
            : value === null
              ? t('Choose file')
              : t('Replace')}
          <input
            type="file"
            disabled={isDisabled}
            onChange={handlePick}
            style={{ display: 'none' }}
          />
        </label>

        {value === null ? (
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              fontSize: 13,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {t('No file chosen')}
          </span>
        ) : (
          <>
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
          </>
        )}
      </div>

      {uploadError === null ? null : (
        <span style={{ color: TASK_TOKENS.textDanger, fontSize: 12 }}>
          {uploadError}
        </span>
      )}
    </div>
  );
};
