import { useRef, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import {
  IconExternalLink,
  IconFile,
  IconLock,
  IconPaperclip,
  IconSend,
  IconX,
} from 'twenty-ui/icon';

import {
  SUPPORT_INBOX_REPLY_MAX_FILES,
  SUPPORT_INBOX_REPLY_MAX_LENGTH,
  SUPPORT_INBOX_REPLY_ROUTE_PATH,
} from '../../constants/crisp';
import {
  CRISP_MESSAGE_FILES_FIELD_UID,
  CRISP_MESSAGE_OBJECT_UID,
} from '../../constants/universal-identifiers';
import {
  type SupportInboxMessage,
  type SupportInboxReplyResult,
} from '../../types/support-inbox';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import {
  type TransferredFile,
  readTransferredFiles,
} from '../utils/read-transferred-files.util';
import { resolveFieldMetadataId } from '../utils/resolve-field-metadata-id.util';
import {
  isUploadFileByHandleAvailable,
  uploadFileByHandle,
} from '../utils/upload-file-by-handle.util';
import { InboxButton } from './inbox-button';
import { INBOX_TOKENS } from './inbox-tokens';

type ReplyComposerProps = {
  conversationId: string;
  canReply: boolean;
  crispUrl: string | null;
  isCompact: boolean;
  onSent: (messages: SupportInboxMessage[]) => void;
};

type Attachment = {
  key: string;
  name: string;
  size: number;
  status: 'uploading' | 'ready' | 'failed';
  fileId: string | null;
};

const MAX_ROWS = 8;
const COUNTER_THRESHOLD = Math.floor(SUPPORT_INBOX_REPLY_MAX_LENGTH * 0.8);

// IME keys (Vietnamese Telex, CJK) report 229 while a word is being composed;
// Enter then confirms the word and must not send.
const isComposingKey = (event: {
  keyCode?: number;
  nativeEvent?: { isComposing?: boolean };
}): boolean => event.nativeEvent?.isComposing === true || event.keyCode === 229;

const formatFileSize = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const CrispLink = ({ crispUrl }: { crispUrl: string }) => (
  <a
    href={crispUrl}
    target="_blank"
    rel="noreferrer"
    title={t('Open in Crisp')}
    style={{
      alignItems: 'center',
      borderRadius: 8,
      color: INBOX_TOKENS.textTertiary,
      display: 'inline-flex',
      fontSize: 12,
      fontWeight: 500,
      gap: 4,
      height: 28,
      padding: '0 8px',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    }}
  >
    <IconExternalLink size={14} />
    {t('Crisp')}
  </a>
);

const ReadOnlyNotice = ({
  crispUrl,
  isCompact,
}: Pick<ReplyComposerProps, 'crispUrl' | 'isCompact'>) => (
  <>
    <div
      style={{
        alignItems: 'center',
        background: INBOX_TOKENS.backgroundSecondary,
        border: `1px dashed ${INBOX_TOKENS.border}`,
        borderRadius: 12,
        color: INBOX_TOKENS.textTertiary,
        display: 'flex',
        flex: 1,
        fontSize: 13,
        gap: 8,
        height: 40,
        minWidth: 0,
        padding: '0 14px',
      }}
    >
      <IconLock size={14} style={{ flexShrink: 0 }} />
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {t('Your role can read this chat but not reply to it.')}
      </span>
    </div>
    {crispUrl !== null && isCompact && (
      <InboxButton href={crispUrl} icon={<IconExternalLink size={15} />}>
        {t('Open in Crisp')}
      </InboxButton>
    )}
  </>
);

const AttachmentChip = ({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: () => void;
}) => (
  <span
    title={attachment.name}
    style={{
      alignItems: 'center',
      background: INBOX_TOKENS.backgroundTertiary,
      border: `1px solid ${
        attachment.status === 'failed'
          ? INBOX_TOKENS.danger
          : INBOX_TOKENS.borderLight
      }`,
      borderRadius: 8,
      display: 'inline-flex',
      fontSize: 12,
      gap: 6,
      height: 28,
      maxWidth: 240,
      opacity: attachment.status === 'uploading' ? 0.7 : 1,
      padding: '0 4px 0 8px',
    }}
  >
    <IconFile
      size={14}
      style={{ color: INBOX_TOKENS.textTertiary, flexShrink: 0 }}
    />
    <span
      style={{
        color: INBOX_TOKENS.textPrimary,
        fontWeight: 500,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {attachment.name}
    </span>
    <span
      style={{
        color:
          attachment.status === 'failed'
            ? INBOX_TOKENS.danger
            : INBOX_TOKENS.textTertiary,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {attachment.status === 'uploading'
        ? t('Uploading…')
        : attachment.status === 'failed'
          ? t('Failed')
          : formatFileSize(attachment.size)}
    </span>
    <button
      type="button"
      aria-label={t('Remove {name}', { name: attachment.name })}
      onClick={onRemove}
      style={{
        alignItems: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        color: INBOX_TOKENS.textTertiary,
        cursor: 'pointer',
        display: 'inline-flex',
        flexShrink: 0,
        height: 20,
        justifyContent: 'center',
        padding: 0,
        width: 20,
      }}
    >
      <IconX size={12} />
    </button>
  </span>
);

const SendButton = ({
  isDisabled,
  isSending,
  onClick,
}: {
  isDisabled: boolean;
  isSending: boolean;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label={t('Send')}
      title={t('Send')}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'center',
        background: isDisabled
          ? INBOX_TOKENS.backgroundTertiary
          : INBOX_TOKENS.accent,
        border: 'none',
        borderRadius: 8,
        color: isDisabled ? INBOX_TOKENS.textLight : INBOX_TOKENS.textInverted,
        cursor: isDisabled ? 'default' : 'pointer',
        display: 'inline-flex',
        filter: isHovered && !isDisabled ? 'brightness(1.08)' : 'none',
        flexShrink: 0,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 500,
        gap: 6,
        height: 30,
        padding: '0 12px',
        transition:
          'background 120ms ease, color 120ms ease, filter 120ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      {isSending ? t('Sending…') : t('Send')}
      <IconSend size={14} />
    </button>
  );
};

export const ReplyComposer = ({
  conversationId,
  canReply,
  crispUrl,
  isCompact,
  onSent,
}: ReplyComposerProps) => {
  // Left uncontrolled, like the search field: a controlled value round-trips
  // through the host and fast typing would drop characters. Sending remounts
  // the field through `resetKey` to clear it.
  const draft = useRef('');
  const [resetKey, setResetKey] = useState(0);
  const [pickerKey, setPickerKey] = useState(0);
  const [rowCount, setRowCount] = useState(1);
  const [hasDraft, setHasDraft] = useState(false);
  const [countedLength, setCountedLength] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isAttachHovered, setIsAttachHovered] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // The sandbox keeps a custom element's first listener, so handlers read the
  // latest state through refs instead of their closure.
  const attachmentsRef = useRef<Attachment[]>([]);
  const isSendingRef = useRef(false);
  const nextAttachmentKey = useRef(0);

  if (!canReply) {
    return <ReadOnlyNotice crispUrl={crispUrl} isCompact={isCompact} />;
  }

  const updateAttachments = (
    update: (current: Attachment[]) => Attachment[],
  ) => {
    attachmentsRef.current = update(attachmentsRef.current);
    setAttachments(attachmentsRef.current);
  };

  const uploadAttachment = async (key: string, file: TransferredFile) => {
    const fieldMetadataId = await resolveFieldMetadataId({
      objectUniversalIdentifier: CRISP_MESSAGE_OBJECT_UID,
      fieldUniversalIdentifier: CRISP_MESSAGE_FILES_FIELD_UID,
    });
    const result =
      fieldMetadataId === null
        ? null
        : await uploadFileByHandle(file.handle, {
            fieldMetadataId,
            fileName: file.name,
          });

    updateAttachments((current) =>
      current.map((attachment) =>
        attachment.key !== key
          ? attachment
          : result?.status === 'uploaded'
            ? { ...attachment, status: 'ready', fileId: result.file.fileId }
            : { ...attachment, status: 'failed' },
      ),
    );
  };

  const addFiles = (files: TransferredFile[]) => {
    if (files.length === 0) {
      return;
    }

    if (!isUploadFileByHandleAvailable()) {
      void enqueueSnackbar({
        message: t('Uploading files is not available on this workspace.'),
        variant: 'error',
      });

      return;
    }

    const room = SUPPORT_INBOX_REPLY_MAX_FILES - attachmentsRef.current.length;
    const accepted = files.slice(0, Math.max(0, room));

    if (accepted.length < files.length) {
      void enqueueSnackbar({
        message: t('Send at most {count} files at once.', {
          count: SUPPORT_INBOX_REPLY_MAX_FILES,
        }),
        variant: 'warning',
      });
    }

    const added = accepted.map((file) => {
      nextAttachmentKey.current += 1;

      return {
        file,
        attachment: {
          key: `attachment-${nextAttachmentKey.current}`,
          name: file.name,
          size: file.size,
          status: 'uploading' as const,
          fileId: null,
        },
      };
    });

    updateAttachments((current) => [
      ...current,
      ...added.map(({ attachment }) => attachment),
    ]);

    for (const { file, attachment } of added) {
      void uploadAttachment(attachment.key, file);
    }
  };

  const removeAttachment = (key: string) =>
    updateAttachments((current) =>
      current.filter((attachment) => attachment.key !== key),
    );

  const send = async () => {
    const text = draft.current.trim();
    const current = attachmentsRef.current;
    const ready = current.filter((attachment) => attachment.status === 'ready');

    if (
      isSendingRef.current ||
      current.some((attachment) => attachment.status === 'uploading') ||
      (text.length === 0 && ready.length === 0)
    ) {
      return;
    }

    isSendingRef.current = true;
    setIsSending(true);

    try {
      const result = await postAppRoute<SupportInboxReplyResult>(
        SUPPORT_INBOX_REPLY_ROUTE_PATH,
        {
          conversationId,
          text,
          files: ready.map((attachment) => ({
            fileId: attachment.fileId,
            name: attachment.name,
          })),
        },
      );

      draft.current = '';
      setResetKey((key) => key + 1);
      setRowCount(1);
      setHasDraft(false);
      setCountedLength(null);
      updateAttachments((latest) =>
        latest.filter(
          (attachment) =>
            !ready.includes(attachment) ||
            result.failedFileIds.includes(attachment.fileId ?? ''),
        ),
      );
      onSent(result.messages);

      if (result.failure !== null) {
        await enqueueSnackbar({ message: result.failure, variant: 'error' });
      }
    } catch (error) {
      await enqueueSnackbar({
        message: readErrorText(error),
        variant: 'error',
      });
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const readyCount = attachments.filter(
    (attachment) => attachment.status === 'ready',
  ).length;
  const isUploading = attachments.some(
    (attachment) => attachment.status === 'uploading',
  );
  const canSend = (hasDraft || readyCount > 0) && !isUploading && !isSending;
  const canAttach =
    !isSending && attachments.length < SUPPORT_INBOX_REPLY_MAX_FILES;

  return (
    <div
      style={{
        background: INBOX_TOKENS.background,
        border: `1px solid ${isFocused ? INBOX_TOKENS.accent : INBOX_TOKENS.border}`,
        borderRadius: 12,
        boxShadow: isFocused
          ? `0 0 0 3px ${INBOX_TOKENS.accentSoft}`
          : INBOX_TOKENS.shadow,
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minWidth: 0,
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
      }}
    >
      {attachments.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            padding: '8px 10px 0',
          }}
        >
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.key}
              attachment={attachment}
              onRemove={() => removeAttachment(attachment.key)}
            />
          ))}
        </div>
      )}
      <textarea
        key={`${conversationId}:${resetKey}`}
        aria-label={t('Reply to the customer')}
        placeholder={t('Write a reply…')}
        rows={rowCount}
        maxLength={SUPPORT_INBOX_REPLY_MAX_LENGTH}
        disabled={isSending}
        autoFocus={resetKey > 0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={(event) => addFiles(readTransferredFiles(event.clipboardData))}
        onChange={(event) => {
          const value = event.target.value;

          draft.current = value;
          setHasDraft(value.trim().length > 0);
          setRowCount(Math.min(MAX_ROWS, value.split('\n').length));
          setCountedLength(
            value.length >= COUNTER_THRESHOLD ? value.length : null,
          );
        }}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !isComposingKey(event)
          ) {
            event.preventDefault();
            void send();
          }
        }}
        style={{
          background: 'transparent',
          border: 'none',
          boxSizing: 'border-box',
          color: INBOX_TOKENS.textPrimary,
          fontFamily: 'inherit',
          fontSize: 13,
          lineHeight: '20px',
          minHeight: 40,
          opacity: isSending ? 0.6 : 1,
          outline: 'none',
          padding: '10px 14px 4px',
          resize: 'none',
          width: '100%',
        }}
      />
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 6,
          minWidth: 0,
          padding: '4px 6px 6px',
        }}
      >
        {/* A label around a hidden input opens the OS picker natively; the
            sandbox cannot forward click() to an input. */}
        <label
          title={t('Attach files')}
          aria-label={t('Attach files')}
          aria-disabled={!canAttach}
          onMouseEnter={() => setIsAttachHovered(true)}
          onMouseLeave={() => setIsAttachHovered(false)}
          style={{
            alignItems: 'center',
            background:
              isAttachHovered && canAttach
                ? INBOX_TOKENS.backgroundHover
                : 'transparent',
            borderRadius: 8,
            color: INBOX_TOKENS.textSecondary,
            cursor: canAttach ? 'pointer' : 'default',
            display: 'inline-flex',
            flexShrink: 0,
            height: 30,
            justifyContent: 'center',
            opacity: canAttach ? 1 : 0.4,
            pointerEvents: canAttach ? 'auto' : 'none',
            transition: 'background 120ms ease',
            width: 30,
          }}
        >
          <IconPaperclip size={16} />
          <input
            key={pickerKey}
            type="file"
            multiple
            disabled={!canAttach}
            onChange={(event) => {
              addFiles(readTransferredFiles(event.target));
              setPickerKey((key) => key + 1);
            }}
            style={{ display: 'none' }}
          />
        </label>
        {crispUrl !== null && isCompact && <CrispLink crispUrl={crispUrl} />}
        <span
          style={{
            color: INBOX_TOKENS.textLight,
            flex: 1,
            fontSize: 11,
            minWidth: 0,
            overflow: 'hidden',
            paddingLeft: 4,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isFocused && !isCompact
            ? t('Enter to send, Shift+Enter for a new line')
            : ''}
        </span>
        {countedLength !== null && (
          <span
            style={{
              color:
                countedLength >= SUPPORT_INBOX_REPLY_MAX_LENGTH
                  ? INBOX_TOKENS.danger
                  : INBOX_TOKENS.textTertiary,
              fontSize: 11,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {`${countedLength.toLocaleString()} / ${SUPPORT_INBOX_REPLY_MAX_LENGTH.toLocaleString()}`}
          </span>
        )}
        <SendButton
          isDisabled={!canSend}
          isSending={isSending}
          onClick={() => void send()}
        />
      </div>
    </div>
  );
};
