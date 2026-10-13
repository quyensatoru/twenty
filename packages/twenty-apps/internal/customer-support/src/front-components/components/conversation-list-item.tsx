import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconHourglassHigh, IconShoppingBag } from 'twenty-ui/icon';

import { type SupportInboxConversation } from '../../types/support-inbox';
import {
  formatListTime,
  formatWaitDuration,
  readWaitSeverity,
} from '../utils/format-inbox-time.util';
import { InboxAvatar } from './inbox-avatar';
import { InboxPill } from './inbox-pill';
import { INBOX_TOKENS, readAppTone, readTone } from './inbox-tokens';

type ConversationListItemProps = {
  conversation: SupportInboxConversation;
  isSelected: boolean;
  // Just got a message while the list was open: glows for a moment.
  isFresh?: boolean;
  onSelect: (conversationId: string) => void;
};

const WAIT_TONES = {
  fresh: readTone('sky'),
  late: readTone('orange'),
  overdue: readTone('red'),
};

export const readConversationName = (
  conversation: SupportInboxConversation,
): string =>
  conversation.visitorName ??
  conversation.visitorEmail ??
  conversation.shopDomain ??
  t('Visitor');

export const ConversationListItem = ({
  conversation,
  isSelected,
  isFresh = false,
  onSelect,
}: ConversationListItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const name = readConversationName(conversation);
  const isWaiting =
    conversation.waitingSince !== null && conversation.status !== 'RESOLVED';
  const appTone = readAppTone(conversation.appName);
  const shop = conversation.merchant?.name ?? conversation.shopDomain;
  const excerpt = conversation.lastMessageExcerpt ?? t('No messages yet');

  return (
    <button
      type="button"
      aria-current={isSelected}
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignItems: 'flex-start',
        background: isSelected
          ? `color-mix(in srgb, ${INBOX_TOKENS.accent} 7%, ${INBOX_TOKENS.background})`
          : isFresh
            ? 'rgba(25,97,237,0.10)'
            : isHovered
              ? INBOX_TOKENS.backgroundHover
              : 'transparent',
        // A soft ring around the whole row, not a bar on one edge: the
        // selection reads as the row itself being lifted.
        boxShadow: isSelected
          ? `inset 0 0 0 1px color-mix(in srgb, ${INBOX_TOKENS.accent} 28%, transparent), 0 1px 2px rgba(16,24,40,.06)`
          : isFresh
            ? `inset 0 0 0 1px color-mix(in srgb, ${INBOX_TOKENS.accent} 45%, transparent)`
            : 'none',
        border: 'none',
        borderRadius: 12,
        color: INBOX_TOKENS.textPrimary,
        cursor: 'pointer',
        display: 'flex',
        fontFamily: 'inherit',
        gap: 12,
        padding: 12,
        position: 'relative',
        textAlign: 'left',
        // Slow out, so a fresh row settles back instead of blinking off.
        transition: isFresh
          ? 'background 120ms ease, box-shadow 120ms ease'
          : 'background 900ms ease, box-shadow 900ms ease',
        width: '100%',
      }}
    >
      <InboxAvatar name={name} ringColor={appTone.text} />
      <span
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 4,
          minWidth: 0,
        }}
      >
        <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <span
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: isWaiting ? 650 : 550,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          {isWaiting && (
            <span
              aria-hidden="true"
              style={{
                background: INBOX_TOKENS.accent,
                borderRadius: 999,
                flexShrink: 0,
                height: 7,
                width: 7,
              }}
            />
          )}
          <span
            style={{
              color: isWaiting
                ? INBOX_TOKENS.textPrimary
                : INBOX_TOKENS.textTertiary,
              flexShrink: 0,
              fontSize: 11.5,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: isWaiting ? 600 : 400,
            }}
          >
            {formatListTime(conversation.lastMessageAt)}
          </span>
        </span>
        <span
          style={{
            color: isWaiting
              ? INBOX_TOKENS.textPrimary
              : INBOX_TOKENS.textSecondary,
            display: '-webkit-box',
            fontSize: 12.5,
            lineHeight: 1.45,
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            wordBreak: 'break-word',
          }}
        >
          {conversation.lastMessageFrom === 'OPERATOR' && (
            <span style={{ color: INBOX_TOKENS.textTertiary }}>
              {t('You')}:{' '}
            </span>
          )}
          {excerpt}
        </span>
        <span
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 2,
          }}
        >
          {isWaiting && (
            <InboxPill
              tone={WAIT_TONES[readWaitSeverity(conversation.waitingSince)]}
              icon={<IconHourglassHigh size={11} />}
              title={t('Waiting for a reply')}
            >
              {formatWaitDuration(conversation.waitingSince)}
            </InboxPill>
          )}
          {conversation.appName !== null && (
            <InboxPill tone={appTone}>{conversation.appName}</InboxPill>
          )}
          {conversation.aiProblem !== null && (
            <InboxPill tone={readTone('gray')} title={t('Problem (AI)')}>
              {conversation.aiProblem}
            </InboxPill>
          )}
          {shop !== null && shop !== undefined && (
            <span
              style={{
                alignItems: 'center',
                color: INBOX_TOKENS.textTertiary,
                display: 'inline-flex',
                fontSize: 11.5,
                gap: 3,
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <IconShoppingBag size={12} />
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {shop.replace(/\.myshopify\.com$/, '')}
              </span>
            </span>
          )}
        </span>
      </span>
    </button>
  );
};
