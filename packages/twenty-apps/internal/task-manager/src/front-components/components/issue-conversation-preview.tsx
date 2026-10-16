import { useState } from 'react';

import { ConversationThreadPanel } from '../support-conversation/components/conversation-thread-panel';
import { CustomerDetailsPanel } from '../support-conversation/components/customer-details-panel';
import { INBOX_TOKENS } from '../support-conversation/components/inbox-tokens';
import { useConversationThread } from '../support-conversation/hooks/use-conversation-thread';

type IssueConversationPreviewProps = {
  conversationId: string;
  onOpenMerchant: (merchantId: string, merchantName: string | null) => void;
  onOpenIssue: (issueId: string) => void;
  issueId?: string;
};

// The Support Inbox's own thread and details, in the compact layout its
// record page uses: the modal column is as narrow as a side panel.
export const IssueConversationPreview = ({
  conversationId,
  onOpenMerchant,
  onOpenIssue,
  issueId,
}: IssueConversationPreviewProps) => {
  const thread = useConversationThread(conversationId);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div
      style={{
        color: INBOX_TOKENS.textPrimary,
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        fontFamily: INBOX_TOKENS.fontFamily,
        minHeight: 0,
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
        isEmbedded
        onBack={() => setIsDetailsOpen(false)}
        onToggleDetails={() => setIsDetailsOpen((isOpen) => !isOpen)}
        onLoadOlder={() => void thread.loadOlder()}
        onOpenMerchant={onOpenMerchant}
        detailsContent={
          thread.conversation === null ? null : (
            <CustomerDetailsPanel
              conversation={thread.conversation}
              issues={thread.issues}
              onIssuesChange={thread.replaceIssues}
              onOpenMerchant={onOpenMerchant}
              onOpenIssue={onOpenIssue}
              isEmbedded
              currentIssueId={issueId}
            />
          )
        }
      />
    </div>
  );
};
