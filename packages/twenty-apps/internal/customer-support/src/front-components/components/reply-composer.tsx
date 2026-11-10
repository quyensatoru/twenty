import { useRef, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconExternalLink, IconLock, IconSend } from 'twenty-ui/icon';

import {
  SUPPORT_INBOX_REPLY_MAX_LENGTH,
  SUPPORT_INBOX_REPLY_ROUTE_PATH,
} from '../../constants/crisp';
import {
  type SupportInboxMessage,
  type SupportInboxReplyResult,
} from '../../types/support-inbox';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { InboxButton } from './inbox-button';
import { INBOX_TOKENS } from './inbox-tokens';

type ReplyComposerProps = {
  conversationId: string;
  canReply: boolean;
  crispUrl: string | null;
  isCompact: boolean;
  onSent: (message: SupportInboxMessage) => void;
};

const MAX_ROWS = 6;

// IME keys (Vietnamese Telex, CJK) report 229 while a word is being composed;
// Enter then confirms the word and must not send.
const isComposingKey = (event: {
  keyCode?: number;
  nativeEvent?: { isComposing?: boolean };
}): boolean => event.nativeEvent?.isComposing === true || event.keyCode === 229;

const ReadOnlyNotice = ({
  crispUrl,
  isCompact,
}: Pick<ReplyComposerProps, 'crispUrl' | 'isCompact'>) => (
  <>
    <div
      style={{
        alignItems: 'center',
        background: INBOX_TOKENS.backgroundSecondary,
        border: `1px solid ${INBOX_TOKENS.border}`,
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
  const [rowCount, setRowCount] = useState(1);
  const [hasDraft, setHasDraft] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  if (!canReply) {
    return <ReadOnlyNotice crispUrl={crispUrl} isCompact={isCompact} />;
  }

  const send = async () => {
    const text = draft.current.trim();

    if (text.length === 0 || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const result = await postAppRoute<SupportInboxReplyResult>(
        SUPPORT_INBOX_REPLY_ROUTE_PATH,
        { conversationId, text },
      );

      draft.current = '';
      setResetKey((key) => key + 1);
      setRowCount(1);
      setHasDraft(false);
      onSent(result.message);
    } catch (error) {
      await enqueueSnackbar({
        message: readErrorText(error),
        variant: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        alignItems: 'flex-end',
        display: 'flex',
        flex: 1,
        gap: 8,
        minWidth: 0,
      }}
    >
      <textarea
        key={`${conversationId}:${resetKey}`}
        aria-label={t('Reply to the customer')}
        placeholder={t('Write a reply…')}
        title={t('Enter to send, Shift+Enter for a new line')}
        rows={rowCount}
        maxLength={SUPPORT_INBOX_REPLY_MAX_LENGTH}
        disabled={isSending}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => {
          const value = event.target.value;

          draft.current = value;
          setHasDraft(value.trim().length > 0);
          setRowCount(Math.min(MAX_ROWS, value.split('\n').length));
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
          background: INBOX_TOKENS.backgroundSecondary,
          border: `1px solid ${isFocused ? INBOX_TOKENS.accent : INBOX_TOKENS.border}`,
          borderRadius: 12,
          boxShadow: isFocused
            ? `0 0 0 3px ${INBOX_TOKENS.accentSoft}`
            : 'none',
          boxSizing: 'border-box',
          color: INBOX_TOKENS.textPrimary,
          flex: 1,
          fontFamily: 'inherit',
          fontSize: 13,
          lineHeight: '20px',
          minHeight: 40,
          minWidth: 0,
          opacity: isSending ? 0.7 : 1,
          outline: 'none',
          padding: '9px 14px',
          resize: 'none',
          transition: 'border-color 120ms ease, box-shadow 120ms ease',
        }}
      />
      {crispUrl !== null && isCompact && (
        <InboxButton href={crispUrl} icon={<IconExternalLink size={15} />}>
          {t('Crisp')}
        </InboxButton>
      )}
      <InboxButton
        variant="primary"
        icon={<IconSend size={15} />}
        isDisabled={!hasDraft || isSending}
        onClick={() => void send()}
      >
        {isSending ? t('Sending…') : t('Send')}
      </InboxButton>
    </div>
  );
};
