import { t } from 'twenty-sdk/front-component';
import { IconLock } from 'twenty-ui/icon';

import { formatMessageTime } from '../utils/format-inbox-time.util';
import { type ThreadMessageGroup } from '../utils/group-thread-messages.util';
import { InboxAvatar } from './inbox-avatar';
import { INBOX_TOKENS, readTone } from './inbox-tokens';
import { MessageContent } from './message-content';

type MessageGroupProps = {
  group: ThreadMessageGroup;
  customerName: string;
};

const NOTE_TONE = readTone('yellow');
const BUBBLE_RADIUS = 18;
const TAIL_RADIUS = 6;

// Bubbles of one burst hug each other: only the corner that points at the
// sender is tightened, and only on the outer bubbles, like Messenger or iOS.
const readBubbleRadius = ({
  isOutgoing,
  isFirst,
  isLast,
}: {
  isOutgoing: boolean;
  isFirst: boolean;
  isLast: boolean;
}): string => {
  const top = isFirst ? BUBBLE_RADIUS : TAIL_RADIUS;
  const bottom = isLast ? BUBBLE_RADIUS : TAIL_RADIUS;

  return isOutgoing
    ? `${BUBBLE_RADIUS}px ${top}px ${bottom}px ${BUBBLE_RADIUS}px`
    : `${top}px ${BUBBLE_RADIUS}px ${BUBBLE_RADIUS}px ${bottom}px`;
};

export const MessageGroup = ({ group, customerName }: MessageGroupProps) => {
  const lastMessage = group.messages[group.messages.length - 1];

  if (group.kind === 'event') {
    return (
      <div
        style={{
          color: INBOX_TOKENS.textTertiary,
          fontSize: 11.5,
          padding: '4px 0',
          textAlign: 'center',
        }}
      >
        {group.messages.map((message) => message.text).join(' · ')}
      </div>
    );
  }

  if (group.kind === 'note') {
    return (
      <div
        style={{
          alignSelf: 'center',
          background: NOTE_TONE.background,
          border: `1px dashed ${NOTE_TONE.text}`,
          borderRadius: 12,
          color: INBOX_TOKENS.textPrimary,
          display: 'flex',
          flexDirection: 'column',
          fontSize: 13,
          gap: 6,
          lineHeight: 1.5,
          maxWidth: '78%',
          padding: '10px 14px',
        }}
      >
        <span
          style={{
            alignItems: 'center',
            color: NOTE_TONE.text,
            display: 'inline-flex',
            fontSize: 11,
            fontWeight: 600,
            gap: 4,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          <IconLock size={12} />
          {t('Internal note')}
          {group.senderName !== null && ` · ${group.senderName}`}
        </span>
        {group.messages.map((message) => (
          <MessageContent
            key={message.id}
            message={message}
            isOutgoing={false}
          />
        ))}
      </div>
    );
  }

  const isOutgoing = group.kind === 'support';
  const senderLabel = isOutgoing
    ? (group.senderName ?? t('Support'))
    : customerName;

  return (
    <div
      style={{
        alignItems: 'flex-end',
        alignSelf: isOutgoing ? 'flex-end' : 'flex-start',
        display: 'flex',
        flexDirection: isOutgoing ? 'row-reverse' : 'row',
        gap: 8,
        maxWidth: '78%',
      }}
    >
      {isOutgoing ? null : <InboxAvatar name={customerName} size={28} />}
      <div
        style={{
          alignItems: isOutgoing ? 'flex-end' : 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
        }}
      >
        <span
          style={{
            color: INBOX_TOKENS.textTertiary,
            fontSize: 11.5,
            fontWeight: 500,
            padding: '0 6px 2px',
          }}
        >
          {senderLabel}
        </span>
        {group.messages.map((message, index) => {
          const isMedia =
            (message.messageType === 'file' ||
              message.messageType === 'animation') &&
            typeof (message.content as { type?: string } | null)?.type ===
              'string' &&
            (message.content as { type: string }).type.startsWith('image/');

          return (
            <div
              key={message.id}
              title={formatMessageTime(message.sentAt)}
              style={{
                background: isMedia
                  ? 'transparent'
                  : isOutgoing
                    ? `linear-gradient(135deg, ${INBOX_TOKENS.accent}, var(--t-color-iris, #4f46e5))`
                    : INBOX_TOKENS.background,
                border:
                  isOutgoing || isMedia
                    ? 'none'
                    : `1px solid ${INBOX_TOKENS.border}`,
                borderRadius: readBubbleRadius({
                  isOutgoing,
                  isFirst: index === 0,
                  isLast: index === group.messages.length - 1,
                }),
                boxShadow:
                  isOutgoing && !isMedia
                    ? '0 1px 2px rgba(25,97,237,.25)'
                    : '0 1px 1px rgba(16,24,40,.04)',
                color: isOutgoing
                  ? INBOX_TOKENS.textInverted
                  : INBOX_TOKENS.textPrimary,
                fontSize: 13.5,
                lineHeight: 1.5,
                maxWidth: '100%',
                padding: isMedia ? 0 : '8px 13px',
              }}
            >
              <MessageContent message={message} isOutgoing={isOutgoing} />
            </div>
          );
        })}
        <span
          style={{
            color: INBOX_TOKENS.textLight,
            fontSize: 10.5,
            fontVariantNumeric: 'tabular-nums',
            padding: '2px 6px 0',
          }}
        >
          {formatMessageTime(lastMessage?.sentAt)}
        </span>
      </div>
    </div>
  );
};
