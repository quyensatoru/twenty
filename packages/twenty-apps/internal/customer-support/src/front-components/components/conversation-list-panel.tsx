import { t } from 'twenty-sdk/front-component';
import { IconInbox, IconRefresh } from 'twenty-ui/icon';

import {
  type SupportInboxConversation,
  type SupportInboxCounts,
  type SupportInboxTab,
} from '../../types/support-inbox';
import { useFreshIds } from '../hooks/use-fresh-ids';
import { formatRelativeTime } from '../utils/format-inbox-time.util';
import { ConversationListItem } from './conversation-list-item';
import { InboxIconButton } from './inbox-icon-button';
import { InboxSearchInput } from './inbox-search-input';
import { InboxSkeletonRows } from './inbox-skeleton';
import {
  INBOX_CARD_STYLE,
  INBOX_THIN_SCROLLBAR_STYLE,
  INBOX_TOKENS,
  readAppTone,
} from './inbox-tokens';

type ConversationListPanelProps = {
  conversations: SupportInboxConversation[];
  counts: SupportInboxCounts | null;
  appNames: string[];
  tab: SupportInboxTab;
  appName: string | null;
  selectedConversationId: string | null;
  lastSyncedAt: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  isSyncing: boolean;
  hasNextPage: boolean;
  error: string | null;
  width: number | string;
  onTabChange: (tab: SupportInboxTab) => void;
  onAppChange: (appName: string | null) => void;
  onSearch: (search: string) => void;
  onSelect: (conversationId: string) => void;
  onLoadMore: () => void;
  onSync: () => void;
};

const readTabLabel = (tab: SupportInboxTab): string =>
  ({
    waiting: t('Needs reply'),
    open: t('Open'),
    resolved: t('Resolved'),
    all: t('All'),
  })[tab];

const readEmptyText = (tab: SupportInboxTab): string =>
  ({
    waiting: t('Nobody is waiting. Every customer has an answer.'),
    open: t('No open conversations.'),
    resolved: t('No resolved conversations yet.'),
    all: t('No conversations synced yet.'),
  })[tab];

const TABS: SupportInboxTab[] = ['waiting', 'open', 'resolved', 'all'];

export const ConversationListPanel = ({
  conversations,
  counts,
  appNames,
  tab,
  appName,
  selectedConversationId,
  lastSyncedAt,
  isLoading,
  isLoadingMore,
  isSyncing,
  hasNextPage,
  error,
  width,
  onTabChange,
  onAppChange,
  onSearch,
  onSelect,
  onLoadMore,
  onSync,
}: ConversationListPanelProps) => {
  const freshIds = useFreshIds(
    conversations.map((conversation) => ({
      id: conversation.id,
      version: conversation.lastMessageAt,
    })),
  );

  // Arrow keys (or j / k) walk the list like a mail client; the list is
  // focusable so the keys land here rather than on the page.
  const moveSelection = (step: number) => {
    if (conversations.length === 0) {
      return;
    }

    const currentIndex = conversations.findIndex(
      (conversation) => conversation.id === selectedConversationId,
    );
    const nextIndex =
      currentIndex === -1
        ? 0
        : Math.min(conversations.length - 1, Math.max(0, currentIndex + step));

    onSelect(conversations[nextIndex].id);
  };

  return (
    <section
      aria-label={t('Conversations')}
      style={{ ...INBOX_CARD_STYLE, flexShrink: 0, width }}
    >
      <div
        style={{
          borderBottom: `1px solid ${INBOX_TOKENS.borderLight}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '16px 16px 12px',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 17,
                fontWeight: 650,
                letterSpacing: '-0.01em',
              }}
            >
              {t('Support inbox')}
            </span>
            <span style={{ color: INBOX_TOKENS.textTertiary, fontSize: 11.5 }}>
              {isSyncing
                ? t('Syncing with Crisp…')
                : lastSyncedAt === null
                  ? t('Live from Crisp')
                  : t('Live · checked {time}', {
                      time: formatRelativeTime(lastSyncedAt),
                    })}
            </span>
          </div>
          <InboxIconButton
            label={t('Sync now')}
            onClick={onSync}
            isDisabled={isSyncing}
          >
            <IconRefresh size={16} />
          </InboxIconButton>
        </div>
        <InboxSearchInput onSearch={onSearch} />
        <div
          role="tablist"
          style={{
            background: INBOX_TOKENS.backgroundTertiary,
            borderRadius: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            padding: 3,
            position: 'relative',
          }}
        >
          {/* One indicator that slides between tabs, rather than each tab
            switching its own background, so a change of tab reads as motion. */}
          <span
            aria-hidden="true"
            style={{
              background: INBOX_TOKENS.background,
              borderRadius: 8,
              bottom: 3,
              boxShadow: INBOX_TOKENS.shadow,
              left: 3,
              position: 'absolute',
              top: 3,
              transform: `translateX(${TABS.indexOf(tab) * 100}%)`,
              transition: 'transform 260ms cubic-bezier(.2,.8,.2,1)',
              width: 'calc((100% - 6px) / 4)',
            }}
          />
          {TABS.map((tabKey) => {
            const isActive = tabKey === tab;
            const count = counts?.[tabKey];
            const isUrgent = tabKey === 'waiting' && (count ?? 0) > 0;

            return (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tabKey)}
                style={{
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: isActive
                    ? INBOX_TOKENS.textPrimary
                    : INBOX_TOKENS.textSecondary,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: 'inherit',
                  gap: 1,
                  padding: '6px 2px',
                  position: 'relative',
                  transition: 'color 160ms ease',
                }}
              >
                <span
                  style={{
                    color: isUrgent ? INBOX_TOKENS.warning : 'inherit',
                    fontSize: 14,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 650,
                  }}
                >
                  {count ?? '·'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textAlign: 'center',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}
                >
                  {readTabLabel(tabKey)}
                </span>
              </button>
            );
          })}
        </div>
        {appNames.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[null, ...appNames].map((option) => {
              const isActive = option === appName;
              const tone = option === null ? null : readAppTone(option);

              return (
                <button
                  key={option ?? 'all'}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onAppChange(option)}
                  style={{
                    alignItems: 'center',
                    background: isActive
                      ? INBOX_TOKENS.textPrimary
                      : INBOX_TOKENS.background,
                    border: `1px solid ${isActive ? INBOX_TOKENS.textPrimary : INBOX_TOKENS.border}`,
                    borderRadius: 999,
                    color: isActive
                      ? INBOX_TOKENS.background
                      : INBOX_TOKENS.textSecondary,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 500,
                    gap: 6,
                    height: 26,
                    padding: '0 10px',
                  }}
                >
                  {tone !== null && (
                    <span
                      style={{
                        background: tone.text,
                        borderRadius: 999,
                        height: 6,
                        width: 6,
                      }}
                    />
                  )}
                  {option ?? t('All apps')}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div
        tabIndex={0}
        aria-label={t('Conversation list, use arrow keys to move')}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'j') {
            event.preventDefault();
            moveSelection(1);
          } else if (event.key === 'ArrowUp' || event.key === 'k') {
            event.preventDefault();
            moveSelection(-1);
          }
        }}
        style={{
          ...INBOX_THIN_SCROLLBAR_STYLE,
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 2,
          minHeight: 0,
          outline: 'none',
          overflowY: 'auto',
          padding: 6,
        }}
      >
        {error !== null && (
          <div
            style={{
              background: 'rgba(220,38,38,0.08)',
              borderRadius: 10,
              color: INBOX_TOKENS.danger,
              fontSize: 12,
              margin: 6,
              padding: '8px 10px',
            }}
          >
            {error}
          </div>
        )}
        {isLoading && conversations.length === 0 ? (
          <InboxSkeletonRows count={7} />
        ) : conversations.length === 0 ? (
          <div
            style={{
              alignItems: 'center',
              color: INBOX_TOKENS.textTertiary,
              display: 'flex',
              flexDirection: 'column',
              fontSize: 13,
              gap: 10,
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                alignItems: 'center',
                background: INBOX_TOKENS.backgroundTertiary,
                borderRadius: 14,
                display: 'inline-flex',
                height: 44,
                justifyContent: 'center',
                width: 44,
              }}
            >
              <IconInbox size={22} />
            </span>
            {readEmptyText(tab)}
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === selectedConversationId}
              isFresh={freshIds.has(conversation.id)}
              onSelect={onSelect}
            />
          ))
        )}
        {hasNextPage && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: 10,
              color: INBOX_TOKENS.textSecondary,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 500,
              margin: '4px 6px 8px',
              padding: '10px 0',
            }}
          >
            {isLoadingMore ? t('Loading…') : t('Show more conversations')}
          </button>
        )}
      </div>
    </section>
  );
};
