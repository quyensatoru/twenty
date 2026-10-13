import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { type SupportInboxTab } from '../../types/support-inbox';
import { useConversationThread } from '../hooks/use-conversation-thread';
import { useInboxConversations } from '../hooks/use-inbox-conversations';
import { useIsMobile } from '../hooks/use-is-mobile';
import { readErrorText } from '../utils/read-error-text.util';
import { ConversationListPanel } from './conversation-list-panel';
import { ConversationThreadPanel } from './conversation-thread-panel';
import { CustomerDetailsPanel } from './customer-details-panel';
import { InboxOverview } from './inbox-overview';
import { INBOX_TOKENS } from './inbox-tokens';

const HISTORY_IMPORT_DAYS = 30;

export const SupportInbox = () => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<SupportInboxTab>('waiting');
  const [appName, setAppName] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  // On a phone details replace the thread, so they start closed every time a
  // conversation is opened.
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

  const selectConversation = (conversationId: string | null) => {
    setSelectedConversationId(conversationId);
    setIsMobileDetailsOpen(false);
  };

  const inbox = useInboxConversations({ tab, appName, search });
  const thread = useConversationThread(selectedConversationId);

  const startSync = async (days?: number) => {
    try {
      await inbox.requestSync(days);
      await enqueueSnackbar({
        message:
          days === undefined
            ? t('Sync started. New chats appear here in a moment.')
            : t(
                'Importing the last {days} days from Crisp in the background.',
                {
                  days,
                },
              ),
        variant: 'success',
      });
      await inbox.refresh();
    } catch (error) {
      await enqueueSnackbar({
        message: readErrorText(error),
        variant: 'error',
      });
    }
  };

  const listPanel = (
    <ConversationListPanel
      conversations={inbox.data?.conversations ?? []}
      counts={inbox.data?.counts ?? null}
      appNames={inbox.data?.appNames ?? []}
      tab={tab}
      appName={appName}
      selectedConversationId={selectedConversationId}
      lastSyncedAt={inbox.data?.sync.lastSyncedAt ?? null}
      isLoading={inbox.isLoading}
      isLoadingMore={inbox.isLoadingMore}
      isSyncing={inbox.isSyncing}
      hasNextPage={inbox.data?.hasNextPage ?? false}
      error={inbox.error}
      width={isMobile ? '100%' : 'clamp(320px, 23vw, 380px)'}
      onTabChange={setTab}
      onAppChange={setAppName}
      onSearch={setSearch}
      onSelect={selectConversation}
      onLoadMore={() => void inbox.loadMore()}
      onSync={() => void startSync()}
    />
  );

  const threadPanel =
    selectedConversationId === null ? (
      <InboxOverview
        counts={inbox.data?.counts ?? null}
        sync={inbox.data?.sync ?? null}
        isSyncing={inbox.isSyncing}
        onOpenTab={setTab}
        onSync={() => void startSync()}
        onImportHistory={() => void startSync(HISTORY_IMPORT_DAYS)}
      />
    ) : (
      <ConversationThreadPanel
        conversation={thread.conversation}
        messages={thread.messages}
        hasOlder={thread.hasOlder}
        isLoading={thread.isLoading}
        isLoadingOlder={thread.isLoadingOlder}
        error={thread.error}
        isDetailsOpen={isMobile ? isMobileDetailsOpen : isDetailsOpen}
        isMobile={isMobile}
        onBack={() => selectConversation(null)}
        onToggleDetails={() =>
          isMobile
            ? setIsMobileDetailsOpen((isOpen) => !isOpen)
            : setIsDetailsOpen((isOpen) => !isOpen)
        }
        detailsContent={
          isMobile && thread.conversation !== null ? (
            <CustomerDetailsPanel
              conversation={thread.conversation}
              issues={thread.issues}
              onIssuesChange={thread.replaceIssues}
              isEmbedded
            />
          ) : undefined
        }
        onLoadOlder={() => void thread.loadOlder()}
      />
    );

  return (
    <div
      style={{
        background: INBOX_TOKENS.backgroundSecondary,
        boxSizing: 'border-box',
        color: INBOX_TOKENS.textPrimary,
        display: 'flex',
        fontFamily: INBOX_TOKENS.fontFamily,
        gap: 12,
        height: '100%',
        minHeight: 560,
        padding: isMobile ? 0 : 12,
        width: '100%',
      }}
    >
      {isMobile ? (
        selectedConversationId === null ? (
          listPanel
        ) : (
          threadPanel
        )
      ) : (
        <>
          {listPanel}
          {threadPanel}
          {isDetailsOpen && thread.conversation !== null && (
            <CustomerDetailsPanel
              conversation={thread.conversation}
              issues={thread.issues}
              onIssuesChange={thread.replaceIssues}
            />
          )}
        </>
      )}
    </div>
  );
};
