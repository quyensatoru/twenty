import { useEffect, useState } from 'react';
import {
  AppPath,
  navigate,
  closeSidePanel,
  t,
  useRecordId,
} from 'twenty-sdk/front-component';
import { IconArrowUpRight } from 'twenty-ui/icon';

import { useConversationThread } from '../hooks/use-conversation-thread';
import { readErrorText } from '../utils/read-error-text.util';
import {
  resolveSupportInboxPath,
  buildSupportInboxConversationPath,
} from '../utils/support-inbox-link.util';
import { InboxIconButton } from './inbox-icon-button';
import { ConversationThreadPanel } from './conversation-thread-panel';
import { CustomerDetailsPanel } from './customer-details-panel';
import { INBOX_TOKENS } from './inbox-tokens';

// The conversation's own record page, opened from an issue, a merchant or a
// link. Record pages are often a narrow side panel, so details swap in for the
// thread rather than sitting beside it.
export const ConversationRecord = () => {
  const recordId = useRecordId();
  const [inboxPath, setInboxPath] = useState<string | null>(null);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const thread = useConversationThread(recordId ?? null);

  useEffect(() => {
    let isCurrent = true;
    void resolveSupportInboxPath()
      .then((path) => {
        if (isCurrent) setInboxPath(path);
      })
      .catch((error) => {
        if (isCurrent) setNavigationError(readErrorText(error));
      });
    return () => {
      isCurrent = false;
    };
  }, []);

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
        flexDirection: 'column',
        minHeight: 480,
        width: '100%',
      }}
    >
      {navigationError !== null && <div role="alert">{navigationError}</div>}
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
        headerActions={
          <InboxIconButton
            label={t('Open full conversation')}
            isDisabled={inboxPath === null}
            onClick={() => {
              if (inboxPath !== null) {
                void navigate(
                  buildSupportInboxConversationPath(
                    inboxPath,
                    recordId,
                  ) as AppPath,
                  undefined,
                  undefined,
                  { surface: 'main' },
                )
                  .then(() => closeSidePanel())
                  .catch((error) => setNavigationError(readErrorText(error)));
              }
            }}
          >
            <IconArrowUpRight size={18} />
          </InboxIconButton>
        }
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
