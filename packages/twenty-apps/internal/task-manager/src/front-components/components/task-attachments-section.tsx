import { type ChangeEvent, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconUpload } from 'twenty-ui/icon';

import { useIssueAttachmentUpload } from '../hooks/use-issue-attachment-upload';
import {
  type IssueAttachmentRow,
  readAttachmentKind,
} from '../utils/read-issue-attachments.util';
import { readTransferredFiles } from '../utils/read-transferred-files.util';
import { isUploadFileByHandleAvailable } from '../utils/upload-file-by-handle.util';
import { TaskSidebarSection } from './issue-details-panel';
import {
  TaskAttachmentRow,
  TaskAttachmentThumbnail,
} from './task-attachment-row';
import { TASK_TOKENS } from './task-tokens';

type TaskAttachmentsSectionProps = {
  issueId: string;
  attachments: IssueAttachmentRow[];
  canWrite: boolean;
  onUploaded: () => void;
};

// Every file on the issue, images as a thumbnail grid and the rest as rows,
// with Upload and a drop zone that file new ones on the same field a pasted
// image lands in.
export const TaskAttachmentsSection = ({
  issueId,
  attachments,
  canWrite,
  onUploaded,
}: TaskAttachmentsSectionProps) => {
  const { isUploading, uploadFilesRef } = useIssueAttachmentUpload({
    issueId,
    onUploaded,
  });
  const canUpload = canWrite && isUploadFileByHandleAvailable();
  const images = attachments.filter(
    (row) => readAttachmentKind(row) === 'image' && typeof row.url === 'string',
  );
  const files = attachments.filter((row) => !images.includes(row));

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const pickedFiles = readTransferredFiles(event.target);
    // So picking the same file a second time still fires `change`.
    event.target.value = '';
    void uploadFilesRef.current(pickedFiles);
  };

  return (
    <TaskSidebarSection
      label={t('Attachments')}
      count={attachments.length === 0 ? undefined : attachments.length}
      action={
        canUpload ? (
          <TaskUploadLabel isUploading={isUploading} onPick={handlePick} />
        ) : null
      }
    >
      {images.length > 0 && (
        <div
          style={{
            display: 'grid',
            gap: 6,
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            padding: '0 8px 4px',
          }}
        >
          {images.map((row) => (
            <TaskAttachmentThumbnail key={row.fileId} row={row} />
          ))}
        </div>
      )}
      {files.map((row) => (
        <TaskAttachmentRow key={row.fileId} row={row} />
      ))}
      {canUpload ? (
        <div
          onDrop={(event) =>
            void uploadFilesRef.current(
              readTransferredFiles(event.dataTransfer),
            )
          }
          style={{
            alignItems: 'center',
            border: `1.5px dashed ${TASK_TOKENS.borderStrong}`,
            borderRadius: TASK_TOKENS.radius,
            boxSizing: 'border-box',
            color: TASK_TOKENS.textTertiary,
            display: 'flex',
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
            gap: 8,
            justifyContent: 'center',
            margin: '6px 8px 0',
            padding: attachments.length === 0 ? 12 : 8,
            textAlign: 'center',
          }}
        >
          <IconUpload size={14} />
          {isUploading
            ? t('Uploading…')
            : attachments.length === 0
              ? t('Drop files here, or paste an image in the description')
              : t('Drop files to attach')}
        </div>
      ) : (
        attachments.length === 0 && (
          <span
            style={{
              color: TASK_TOKENS.textLight,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 13,
              padding: '4px 8px',
            }}
          >
            {t('No attachments yet')}
          </span>
        )
      )}
    </TaskSidebarSection>
  );
};

type TaskUploadLabelProps = {
  isUploading: boolean;
  onPick: (event: ChangeEvent<HTMLInputElement>) => void;
};

// A <label> wrapping a hidden file input, so the OS dialog opens through the
// browser's own behaviour: the sandbox cannot forward click() to an input.
const TaskUploadLabel = ({ isUploading, onPick }: TaskUploadLabelProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <label
      aria-label={t('Upload attachment')}
      aria-disabled={isUploading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isHovered ? TASK_TOKENS.backgroundHover : 'transparent',
        borderRadius: TASK_TOKENS.radiusSmall,
        color: TASK_TOKENS.textSecondary,
        cursor: isUploading ? 'default' : 'pointer',
        display: 'inline-flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12,
        fontWeight: 500,
        gap: 4,
        opacity: isUploading ? 0.6 : 1,
        padding: '3px 6px',
        pointerEvents: isUploading ? 'none' : 'auto',
      }}
    >
      <IconUpload size={12} />
      {isUploading ? t('Uploading…') : t('Upload')}
      <input
        type="file"
        multiple
        disabled={isUploading}
        onChange={onPick}
        style={{ display: 'none' }}
      />
    </label>
  );
};
