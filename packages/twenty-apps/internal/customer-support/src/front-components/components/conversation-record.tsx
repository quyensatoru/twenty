import { useState } from 'react';
import { t, useRecordId } from 'twenty-sdk/front-component';

import { useConversationThread } from '../hooks/use-conversation-thread';
import { ConversationThreadPanel } from './conversation-thread-panel';
import { CustomerDetailsPanel } from './customer-details-panel';
import { INBOX_TOKENS } from './inbox-tokens';

// The conversation's own record page, opened from an issue, a merchant or a
// link. Record pages are often a narrow side panel, so details swap in for the
// thread rather than sitting beside it.
export const ConversationRecord = () => {
  const recordId = useRecordId();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const thread = useConversationThread(recordId ?? null);

  if (recordId === null || recordId === undefined) {
    return (
      <div
        style={{ color: INBOX_TOKENS.textTertiary, fontSize: 13, padding: 16 }}
      >
        {t('No conversation selected.')}
      </div>
    );
  }

  return (
    <div
      style={{
        boxSizing: 'border-box',
        color: INBOX_TOKENS.textPrimary,
        display: 'flex',
        fontFamily: INBOX_TOKENS.fontFamily,
        height: '100%',
        minHeight: 480,
        width: '100%',
      }}
    >
      <ConversationThreadPanel
        conversation={thread.conversation}
        messages={thread.messages}
        hasOlder={thread.hasOlder}
        isLoading={thread.isLoading}
        isLoadingOlder={thread.isLoadingOlder}
        error={thread.error}
        isDetailsOpen={isDetailsOpen}
        isMobile={false}
        onBack={() => setIsDetailsOpen(false)}
        onToggleDetails={() => setIsDetailsOpen((isOpen) => !isOpen)}
        onLoadOlder={() => void thread.loadOlder()}
        detailsContent={
          thread.conversation === null ? undefined : (
            <CustomerDetailsPanel
              conversation={thread.conversation}
              issues={thread.issues}
              onIssuesChange={thread.replaceIssues}
              isEmbedded
            />
          )
        }
      />
    </div>
  );
};
