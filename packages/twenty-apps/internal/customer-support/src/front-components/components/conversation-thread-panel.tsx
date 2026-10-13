import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconChevronLeft,
  IconExternalLink,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconLock,
  IconShoppingBag,
} from 'twenty-ui/icon';

import { buildCrispConversationUrl } from '../../constants/crisp';
import {
  type SupportInboxConversation,
  type SupportInboxMessage,
} from '../../types/support-inbox';
import { PULSE_TRANSITION, usePulse } from '../hooks/use-pulse';
import {
  formatDayLabel,
  formatWaitDuration,
} from '../utils/format-inbox-time.util';
import { openRecordInSidePanel } from '../utils/open-record-in-side-panel.util';
import { groupThreadMessages } from '../utils/group-thread-messages.util';
import { readConversationName } from './conversation-list-item';
import { ConversationStatusPill } from './conversation-status-pill';
import { FadeIn } from './fade-in';
import { InboxAvatar } from './inbox-avatar';
import { InboxButton } from './inbox-button';
import { InboxIconButton } from './inbox-icon-button';
import { InboxPill } from './inbox-pill';
import { InboxSkeletonBar } from './inbox-skeleton';
import {
  INBOX_CARD_STYLE,
  INBOX_THIN_SCROLLBAR_STYLE,
  INBOX_TOKENS,
  readAppTone,
  readTone,
} from './inbox-tokens';
import { MessageGroup } from './message-group';

type ConversationThreadPanelProps = {
  conversation: SupportInboxConversation | null;
  messages: SupportInboxMessage[];
  hasOlder: boolean;
  isLoading: boolean;
  isLoadingOlder: boolean;
  error: string | null;
  isDetailsOpen: boolean;
  isMobile: boolean;
  onBack: () => void;
  onToggleDetails: () => void;
  onLoadOlder: () => void;
  // Shown in place of the thread while details are open. Left out, details
  // live in a column beside the panel and the thread always stays.
  detailsContent?: ReactNode;
};

const readCrispUrl = (conversation: SupportInboxConversation): string | null =>
  conversation.websiteId === null || conversation.sessionId === null
    ? null
    : buildCrispConversationUrl({
        websiteId: conversation.websiteId,
        sessionId: conversation.sessionId,
      });

const ThreadSkeleton = () => {
  const isDim = usePulse();

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        opacity: isDim ? 0.55 : 1,
        padding: 24,
        transition: PULSE_TRANSITION,
      }}
    >
      {[62, 40, 70, 34, 55].map((width, index) => (
        <div
          key={index}
          style={{
            alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end',
            background: INBOX_TOKENS.backgroundTertiary,
            borderRadius: 18,
            height: 38,
            width: `${width}%`,
          }}
        />
      ))}
    </div>
  );
};

export const ConversationThreadPanel = ({
  conversation,
  messages,
  hasOlder,
  isLoading,
  isLoadingOlder,
  error,
  isDetailsOpen,
  isMobile,
  onBack,
  onToggleDetails,
  onLoadOlder,
  detailsContent,
}: ConversationThreadPanelProps) => {
  // Narrow places (the record page in a side panel, a phone) get the compact
  // layout: details swap in for the thread, the pills move under the name,
  // and the footer keeps only the reply action.
  const isCompact = detailsContent !== undefined;
  const isShowingDetailsInPlace = isCompact && isDetailsOpen;
  const name = conversation === null ? '' : readConversationName(conversation);
  const crispUrl = conversation === null ? null : readCrispUrl(conversation);
  const days = groupThreadMessages(messages);
  const dayLabels = { today: t('Today'), yesterday: t('Yesterday') };
  const shop = conversation?.merchant?.name ?? conversation?.shopDomain ?? null;
  const merchantId = conversation?.merchant?.id ?? null;
  const statusPills =
    conversation === null ? null : (
      <>
        <ConversationStatusPill status={conversation.status} />
        {conversation.waitingSince !== null &&
          conversation.status !== 'RESOLVED' && (
            <InboxPill
              tone={readTone('orange')}
              title={t('Waiting for a reply')}
            >
              {t('Waiting {duration}', {
                duration: formatWaitDuration(conversation.waitingSince),
              })}
            </InboxPill>
          )}
      </>
    );

  return (
    <section
      aria-label={t('Conversation')}
      style={{ ...INBOX_CARD_STYLE, flex: 1 }}
    >
      <header
        style={{
          alignItems: 'center',
          background: INBOX_TOKENS.background,
          borderBottom: `1px solid ${INBOX_TOKENS.borderLight}`,
          display: 'flex',
          gap: 12,
          minHeight: 68,
          padding: '12px 16px',
        }}
      >
        {isMobile && (
          <InboxIconButton label={t('Back')} onClick={onBack}>
            <IconChevronLeft size={18} />
          </InboxIconButton>
        )}
        {conversation === null ? (
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <InboxSkeletonBar width={160} height={12} />
            <InboxSkeletonBar width={220} height={9} />
          </div>
        ) : (
          <>
            <InboxAvatar
              name={name}
              size={40}
              ringColor={readAppTone(conversation.appName).text}
            />
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 2,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 650,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </span>
              </span>
              {/* Pills sit under the name, beside the contact line, so the
                  name keeps the full width even when the column is narrow. */}
              <span
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  gap: 6,
                  minWidth: 0,
                }}
              >
                {statusPills}
                {!isCompact &&
                  (conversation.visitorEmail !== null || shop !== null) && (
                    <span
                      style={{
                        alignItems: 'center',
                        color: INBOX_TOKENS.textTertiary,
                        display: 'flex',
                        fontSize: 12,
                        gap: 6,
                        minWidth: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conversation.visitorEmail !== null && (
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {conversation.visitorEmail}
                        </span>
                      )}
                      {conversation.visitorEmail !== null && shop !== null && (
                        <span aria-hidden="true">·</span>
                      )}
                      {shop !== null &&
                        (merchantId === null ? (
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {shop}
                          </span>
                        ) : (
                          <button
                            type="button"
                            title={t('Open merchant')}
                            onClick={() =>
                              openRecordInSidePanel('merchant', merchantId)
                            }
                            style={{
                              alignItems: 'center',
                              background: 'transparent',
                              border: 'none',
                              color: INBOX_TOKENS.accent,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              fontFamily: 'inherit',
                              fontSize: 12,
                              fontWeight: 500,
                              gap: 3,
                              minWidth: 0,
                              padding: 0,
                            }}
                          >
                            <IconShoppingBag
                              size={12}
                              style={{ flexShrink: 0 }}
                            />
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {shop}
                            </span>
                          </button>
                        ))}
                    </span>
                  )}
              </span>
            </div>
            {crispUrl !== null && !isMobile && !isCompact && (
              <InboxButton
                href={crispUrl}
                icon={<IconExternalLink size={15} />}
              >
                {t('Open in Crisp')}
              </InboxButton>
            )}
            {(!isMobile || isCompact) && (
              <InboxIconButton
                label={isDetailsOpen ? t('Hide details') : t('Show details')}
                onClick={onToggleDetails}
                isActive={isDetailsOpen}
              >
                {isDetailsOpen ? (
                  <IconLayoutSidebarRightCollapse size={18} />
                ) : (
                  <IconLayoutSidebarRightExpand size={18} />
                )}
              </InboxIconButton>
            )}
          </>
        )}
      </header>
      {isShowingDetailsInPlace ? (
        detailsContent
      ) : (
        <>
          {/* column-reverse keeps the view pinned to the newest message without
          scrolling by hand, which the sandbox cannot do reliably. */}
          <div
            style={{
              ...INBOX_THIN_SCROLLBAR_STYLE,
              background: INBOX_TOKENS.backgroundSecondary,
              display: 'flex',
              flex: 1,
              flexDirection: 'column-reverse',
              // Scroll anchoring fights column-reverse: an image loading
              // below would otherwise shift the view off the newest message.
              overflowAnchor: 'none',
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: '20px 24px 24px',
              }}
            >
              {error !== null && (
                <div
                  style={{
                    alignSelf: 'center',
                    background: 'rgba(220,38,38,0.08)',
                    borderRadius: 10,
                    color: INBOX_TOKENS.danger,
                    fontSize: 12,
                    padding: '8px 12px',
                  }}
                >
                  {error}
                </div>
              )}
              {isLoading && messages.length === 0 ? (
                <ThreadSkeleton />
              ) : (
                <>
                  {hasOlder && (
                    <button
                      type="button"
                      onClick={onLoadOlder}
                      disabled={isLoadingOlder}
                      style={{
                        alignSelf: 'center',
                        background: INBOX_TOKENS.background,
                        border: `1px solid ${INBOX_TOKENS.border}`,
                        borderRadius: 999,
                        color: INBOX_TOKENS.textSecondary,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '6px 14px',
                      }}
                    >
                      {isLoadingOlder
                        ? t('Loading…')
                        : t('Load earlier messages')}
                    </button>
                  )}
                  {messages.length === 0 && !isLoading && (
                    <div
                      style={{
                        color: INBOX_TOKENS.textTertiary,
                        fontSize: 13,
                        padding: '40px 0',
                        textAlign: 'center',
                      }}
                    >
                      {t('No messages synced for this conversation yet.')}
                    </div>
                  )}
                  {days.map((day) => (
                    <div
                      key={day.key}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                      }}
                    >
                      <span
                        style={{
                          alignSelf: 'center',
                          background: INBOX_TOKENS.background,
                          border: `1px solid ${INBOX_TOKENS.borderLight}`,
                          borderRadius: 999,
                          boxShadow: INBOX_TOKENS.shadow,
                          color: INBOX_TOKENS.textSecondary,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.01em',
                          margin: '6px 0 2px',
                          padding: '4px 12px',
                        }}
                      >
                        {formatDayLabel(day.firstSentAt, dayLabels)}
                      </span>
                      {day.groups.map((group) => (
                        <FadeIn
                          key={group.key}
                          style={{ display: 'flex', flexDirection: 'column' }}
                        >
                          <MessageGroup group={group} customerName={name} />
                        </FadeIn>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <footer
            style={{
              alignItems: 'center',
              background: INBOX_TOKENS.background,
              borderTop: `1px solid ${INBOX_TOKENS.borderLight}`,
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              padding: '12px 16px',
            }}
          >
            {!isCompact && (
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
                  {t(
                    'Read-only mirror. Reply from Crisp so the customer sees it.',
                  )}
                </span>
              </div>
            )}
            {crispUrl !== null && (
              <InboxButton
                variant="primary"
                href={crispUrl}
                icon={<IconExternalLink size={15} />}
              >
                {t('Reply in Crisp')}
              </InboxButton>
            )}
          </footer>
        </>
      )}
    </section>
  );
};
