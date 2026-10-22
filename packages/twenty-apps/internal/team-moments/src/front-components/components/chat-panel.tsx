import { useCallback, useEffect, useRef, useState } from 'react';
import { IconPhoto, IconX } from 'twenty-ui/icon';

import { EVENT_MESSAGE_ATTACHMENT_MAX_BYTES, EVENT_MESSAGE_ATTACHMENTS_MAX } from '../../constants/event-message-attachments';
import { EVENT_MESSAGE_ATTACHMENTS_FIELD_UID, EVENT_MESSAGE_OBJECT_UID } from '../../constants/universal-identifiers';
import { MESSAGE_QUERY_LIMIT } from '../../constants/query-limits';
import { NOTIFY_EVENT_MESSAGE_MENTION_ROUTE_PATH } from '../../constants/route-paths';
import { type EventMessageRow, type MemberSummary, type MessageAttachment } from '../../types/moments-records';
import { type TransferredFile } from '../../types/transferred-file';
import { createRecord, listRecords, postAppRoute, readErrorText, updateRecord } from '../utils/moments-rest.util';
import { getChatMentionQuery, insertChatMention } from '../utils/chat-mentions.util';
import { readAttachmentKind, readFileExtension } from '../utils/read-attachment-kind.util';
import { readTransferredFiles } from '../utils/read-transferred-files.util';
import { resolveFieldMetadataId } from '../utils/resolve-field-metadata-id.util';
import { isUploadFileByHandleAvailable, uploadFileByHandle } from '../utils/upload-file-by-handle.util';
import { MemberAvatar } from './member-avatar';
import { MessageAttachments } from './message-attachments';
import { MomentsButton } from './moments-button';
import { MomentsTextField } from './moments-text-field';
import { MOMENTS_TOKENS } from './moments-tokens';

const POLL_MILLIS = 5000;

const WISH_SUGGESTIONS = [
  'Chúc bạn một năm thật rực rỡ, mọi dự định đều thành công!',
  'Cảm ơn vì đã luôn là một đồng đội tuyệt vời. Chúc mừng nhé!',
  'Chúc ngày hôm nay thật nhiều niềm vui, tiếng cười và quà!',
  'Luôn khoẻ, luôn vui và luôn là chính mình nhé!',
];

type ChatPanelProps = {
  occurrenceKey: string;
  eventTitle: string;
  currentMember: MemberSummary | null;
  memberNames: Record<string, string>;
};

type PendingAttachment = MessageAttachment & { isUploading: boolean; localId: string };

const formatTime = (isoDateTime: string): string => {
  const date = new Date(isoDateTime);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
};

export const ChatPanel = ({ occurrenceKey, eventTitle, currentMember, memberNames }: ChatPanelProps) => {
  const [messages, setMessages] = useState<EventMessageRow[]>([]);
  const [draft, setDraft] = useState('');
  // Picked ids, tracked alongside the spliced "@Name " text: `insertChatMention`
  // only edits the draft string, so without this a mention would have no
  // structured member reference for the notification route to read.
  const [mentionedMemberIds, setMentionedMemberIds] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Clearing the draft to a value typed before (the empty string) would not
  // reach the stable field, so a sent message remounts it instead.
  const [composerKey, setComposerKey] = useState(0);
  const suggestionIndex = useRef(0);
  const composerRef = useRef<HTMLInputElement>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [isMentionDismissed, setIsMentionDismissed] = useState(false);
  const mentionQuery = isMentionDismissed ? null : getChatMentionQuery(draft);
  const mentionOptions = mentionQuery === null ? [] : [
    ...Object.entries(memberNames).map(([id, name]) => ({ id, name, search: name })),
    { id: 'everyone', name: 'mọi người', search: 'mọi người all everyone' },
  ].filter((option) => option.search.toLocaleLowerCase('vi-VN').includes(mentionQuery.trim().toLocaleLowerCase('vi-VN')));
  const selectedMentionIndex = Math.min(activeMentionIndex, Math.max(0, mentionOptions.length - 1));

  useEffect(() => {
    if (composerKey > 0) composerRef.current?.focus();
  }, [composerKey]);

  const selectMention = (option: { id: string; name: string }) => {
    setDraft((current) => insertChatMention(current, option.name));
    if (option.id !== 'everyone') {
      setMentionedMemberIds((current) =>
        current.includes(option.id) ? current : [...current, option.id],
      );
    }
    setIsMentionDismissed(true);
    setComposerKey((current) => current + 1);
  };

  const load = useCallback(async () => {
    try {
      setMessages(
        await listRecords<EventMessageRow>('eventMessages', {
          filter: `occurrenceKey[eq]:"${occurrenceKey}"`,
          order_by: 'createdAt[AscNullsLast]',
          limit: MESSAGE_QUERY_LIMIT,
        }),
      );
      setError(null);
    } catch (loadError) {
      setError(readErrorText(loadError));
    }
  }, [occurrenceKey]);

  useEffect(() => {
    setMessages([]);
    void load();

    const timer = setInterval(() => void load(), POLL_MILLIS);

    return () => clearInterval(timer);
  }, [load]);

  const uploadFiles = async (files: TransferredFile[]) => {
    const usable = files.filter((file) => typeof file.handle === 'string' && file.handle.length > 0);

    if (usable.length === 0) {
      return;
    }

    if (!isUploadFileByHandleAvailable()) {
      setError('Trình duyệt này chưa hỗ trợ gửi file từ app.');

      return;
    }

    const tooLarge = usable.find((file) => file.size > EVENT_MESSAGE_ATTACHMENT_MAX_BYTES);

    if (tooLarge !== undefined) {
      setError(`"${tooLarge.name}" lớn hơn 25 MB.`);

      return;
    }

    const room = EVENT_MESSAGE_ATTACHMENTS_MAX - pending.length;
    const accepted = usable.slice(0, Math.max(0, room));

    if (accepted.length < usable.length) {
      setError(`Mỗi tin nhắn gửi tối đa ${EVENT_MESSAGE_ATTACHMENTS_MAX} file.`);
    }

    const fieldMetadataId = await resolveFieldMetadataId({
      objectUniversalIdentifier: EVENT_MESSAGE_OBJECT_UID,
      fieldUniversalIdentifier: EVENT_MESSAGE_ATTACHMENTS_FIELD_UID,
    });

    if (fieldMetadataId === null) {
      setError('Không tìm thấy nơi lưu file của app.');

      return;
    }

    const placeholders: PendingAttachment[] = accepted.map((file, index) => ({
      localId: `${Date.now()}-${index}`,
      fileId: '',
      label: file.name,
      extension: readFileExtension(file.name),
      url: null,
      isUploading: true,
    }));

    setPending((current) => [...current, ...placeholders]);

    await Promise.all(
      accepted.map(async (file, index) => {
        const { localId } = placeholders[index];
        const result = await uploadFileByHandle(file.handle ?? '', { fieldMetadataId, fileName: file.name });

        setPending((current) =>
          result.status === 'uploaded'
            ? current.map((entry) => (entry.localId === localId ? { ...entry, fileId: result.file.fileId, url: result.file.url, isUploading: false } : entry))
            : current.filter((entry) => entry.localId !== localId),
        );

        if (result.status !== 'uploaded') {
          setError(`Không tải lên được "${file.name}".`);
        }
      }),
    );
  };

  const isUploading = pending.some((entry) => entry.isUploading);
  const canSend = !isSending && !isUploading && (draft.trim().length > 0 || pending.length > 0);

  const send = async () => {
    if (!canSend) {
      return;
    }

    setIsSending(true);

    const trimmedBody = draft.trim();
    const recipients = mentionedMemberIds;

    try {
      const created = await createRecord<EventMessageRow>('eventMessages', {
        occurrenceKey,
        body: trimmedBody,
        authorId: currentMember?.id ?? null,
        heartMemberIds: [],
        mentionMemberIds: recipients,
        media: pending.map(({ fileId, label }) => ({ fileId, label })),
      });

      setMessages((current) => [...current, { ...created, media: created.media ?? pending }]);
      setDraft('');
      setIsMentionDismissed(false);
      setMentionedMemberIds([]);
      setPending([]);
      setComposerKey((current) => current + 1);
      setError(null);

      // Best-effort: a failed notification should never surface as a failed
      // send, since the message itself is already saved by this point.
      if (recipients.length > 0 && currentMember !== null) {
        void postAppRoute(NOTIFY_EVENT_MESSAGE_MENTION_ROUTE_PATH, {
          actorMemberId: currentMember.id,
          eventTitle,
          excerpt: trimmedBody,
          mentionMemberIds: recipients,
        }).catch(() => {});
      }
    } catch (sendError) {
      setError(readErrorText(sendError));
    } finally {
      setIsSending(false);
    }
  };

  const toggleHeart = async (message: EventMessageRow) => {
    if (currentMember === null) {
      return;
    }

    const hearts = message.heartMemberIds ?? [];
    const nextHearts = hearts.includes(currentMember.id)
      ? hearts.filter((memberId) => memberId !== currentMember.id)
      : [...hearts, currentMember.id];

    setMessages((current) => current.map((row) => (row.id === message.id ? { ...row, heartMemberIds: nextHearts } : row)));

    try {
      await updateRecord('eventMessages', message.id, { heartMemberIds: nextHearts });
    } catch (heartError) {
      setError(readErrorText(heartError));
      void load();
    }
  };

  const suggest = () => {
    setDraft(WISH_SUGGESTIONS[suggestionIndex.current % WISH_SUGGESTIONS.length]);
    suggestionIndex.current += 1;
  };

  return (
    <div
      onDrop={(event) => void uploadFiles(readTransferredFiles(event.dataTransfer))}
      style={{ display: 'flex', flex: 1, flexDirection: 'column', fontFamily: MOMENTS_TOKENS.fontFamily, minHeight: 0 }}
    >
      <div style={{ background: MOMENTS_TOKENS.backgroundSecondary, display: 'flex', flex: 1, flexDirection: 'column', gap: 16, minHeight: 320, overflowY: 'auto', padding: '20px 24px' }}>
        {messages.length === 0 ? (
          <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13, margin: 'auto', textAlign: 'center' }}>
            Chưa có lời chúc nào. Hãy là người đầu tiên!
          </div>
        ) : null}
        {messages.map((message) => {
          const authorName = (message.authorId !== null ? memberNames[message.authorId] : undefined) ?? 'Thành viên';
          const hearts = message.heartMemberIds ?? [];
          const isHearted = currentMember !== null && hearts.includes(currentMember.id);

          return (
            <div key={message.id} style={{ alignItems: 'flex-start', display: 'flex', gap: 10 }}>
              <MemberAvatar name={authorName} seed={message.authorId ?? message.id} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ alignItems: 'baseline', display: 'flex', gap: 8 }}>
                  <span style={{ color: MOMENTS_TOKENS.textPrimary, fontSize: 13, fontWeight: 600 }}>{authorName}</span>
                  <span style={{ color: MOMENTS_TOKENS.textTertiary, fontSize: 12 }}>{formatTime(message.createdAt)}</span>
                </div>
                {message.body.length === 0 ? null : (
                  <div style={{ color: MOMENTS_TOKENS.textPrimary, fontSize: 14, lineHeight: 1.5, marginTop: 3, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.body}</div>
                )}
                <MessageAttachments attachments={message.media ?? []} />
                <button
                  type="button"
                  aria-pressed={isHearted}
                  aria-label="Thả tim"
                  onClick={() => void toggleHeart(message)}
                  style={{
                    background: isHearted ? '#FDEDF5' : MOMENTS_TOKENS.background,
                    border: `1px solid ${isHearted ? '#F3A6CB' : MOMENTS_TOKENS.border}`,
                    borderRadius: 11,
                    color: isHearted ? '#9B1C5E' : MOMENTS_TOKENS.textSecondary,
                    cursor: 'pointer',
                    fontSize: 11,
                    height: 22,
                    marginTop: 6,
                    padding: '0 8px',
                  }}
                >
                  ♥ {hearts.length}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background: MOMENTS_TOKENS.background, borderTop: `1px solid ${MOMENTS_TOKENS.border}`, display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 20px 16px' }}>
        {error === null ? null : <span style={{ color: MOMENTS_TOKENS.danger, fontSize: 12 }}>{error}</span>}
        {pending.length === 0 ? null : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {pending.map((entry) => (
              <div key={entry.localId} style={{ background: MOMENTS_TOKENS.backgroundTertiary, borderRadius: 8, height: 64, overflow: 'hidden', position: 'relative', width: 64 }}>
                {entry.isUploading || entry.url === null || entry.url === undefined ? (
                  <span style={{ alignItems: 'center', color: MOMENTS_TOKENS.textTertiary, display: 'flex', fontSize: 11, height: '100%', justifyContent: 'center' }}>Đang tải…</span>
                ) : readAttachmentKind(entry) === 'image' ? (
                  <img src={entry.url} alt={entry.label} style={{ height: '100%', objectFit: 'cover', width: '100%' }} />
                ) : (
                  <span style={{ alignItems: 'center', color: MOMENTS_TOKENS.textSecondary, display: 'flex', fontSize: 11, height: '100%', justifyContent: 'center', padding: 4, textAlign: 'center', wordBreak: 'break-all' }}>{entry.label}</span>
                )}
                <button
                  type="button"
                  aria-label={`Bỏ ${entry.label}`}
                  onClick={() => setPending((current) => current.filter((item) => item.localId !== entry.localId))}
                  style={{ alignItems: 'center', background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: '50%', color: '#ffffff', cursor: 'pointer', display: 'flex', height: 18, justifyContent: 'center', padding: 0, position: 'absolute', right: 3, top: 3, width: 18 }}
                >
                  <IconX size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ position: 'relative' }}>
          {mentionQuery === null ? null : (
            <div role="listbox" aria-label="Tag thành viên" style={{ background: MOMENTS_TOKENS.background, border: `1px solid ${MOMENTS_TOKENS.border}`, borderRadius: MOMENTS_TOKENS.radius, bottom: 'calc(100% + 6px)', boxShadow: MOMENTS_TOKENS.shadow, left: 0, maxHeight: 220, overflowY: 'auto', position: 'absolute', right: 0, zIndex: 2 }}>
              {mentionOptions.length === 0 ? (
                <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13, padding: 10 }}>Không tìm thấy thành viên</div>
              ) : mentionOptions.map((option, index) => (
                <button key={option.id} type="button" role="option" aria-selected={index === selectedMentionIndex} onClick={() => selectMention(option)} style={{ alignItems: 'center', background: index === selectedMentionIndex ? MOMENTS_TOKENS.accentSoft : 'transparent', border: 'none', color: MOMENTS_TOKENS.textPrimary, cursor: 'pointer', display: 'flex', fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 13, gap: 8, padding: '7px 10px', textAlign: 'left', width: '100%' }}>
                  {option.id === 'everyone' ? <span aria-hidden="true">@</span> : <MemberAvatar name={option.name} seed={option.id} size={22} />}
                  {option.name}
                </button>
              ))}
            </div>
          )}
          <MomentsTextField
            key={composerKey}
            inputRef={composerRef}
            value={draft}
            onChange={(value) => {
              setDraft(value);
              setActiveMentionIndex(0);
              if ((value.match(/@/g)?.length ?? 0) > (draft.match(/@/g)?.length ?? 0) || getChatMentionQuery(value) === null) {
                setIsMentionDismissed(false);
              }
            }}
            onKeyDown={(event) => {
              if (mentionQuery === null) return false;
              if (event.key === 'Escape') {
                event.preventDefault();
                setIsMentionDismissed(true);
                return true;
              }
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                if (mentionOptions.length > 0) setActiveMentionIndex((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + mentionOptions.length) % mentionOptions.length);
                return true;
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                if (mentionOptions[selectedMentionIndex]) selectMention(mentionOptions[selectedMentionIndex]);
                return true;
              }
              return false;
            }}
            onEnter={() => void send()}
            onPasteTransfer={(transfer) => void uploadFiles(readTransferredFiles(transfer))}
            ariaLabel="Lời chúc"
            placeholder="Viết lời chúc, gõ @ để tag thành viên..."
          />
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 4 }}>
          {/* A label around a hidden file input opens the OS picker natively; the sandbox cannot forward click() to an input. */}
          <label
            aria-label="Gửi ảnh, GIF hoặc video"
            style={{ alignItems: 'center', borderRadius: MOMENTS_TOKENS.radiusSmall, color: MOMENTS_TOKENS.textSecondary, cursor: 'pointer', display: 'inline-flex', fontSize: 13, gap: 6, height: 26, padding: '0 8px' }}
          >
            <IconPhoto size={16} />
            Ảnh / GIF / video
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(event) => {
                void uploadFiles(readTransferredFiles(event.target));
                event.target.value = '';
              }}
              style={{ display: 'none' }}
            />
          </label>
          <MomentsButton variant="ghost" size="small" onClick={() => {
            setDraft((current) => `${current}${current.length === 0 || /\s$/.test(current) ? '' : ' '}@`);
            setActiveMentionIndex(0);
            setIsMentionDismissed(false);
            setComposerKey((current) => current + 1);
          }}>Tag @</MomentsButton>
          <MomentsButton variant="ghost" size="small" onClick={suggest}>Gợi ý lời chúc</MomentsButton>
          <span style={{ marginLeft: 'auto' }} />
          <MomentsButton variant="primary" isDisabled={!canSend} onClick={() => void send()}>
            {isUploading ? 'Đang tải file…' : 'Gửi'}
          </MomentsButton>
        </div>
      </div>
    </div>
  );
};
