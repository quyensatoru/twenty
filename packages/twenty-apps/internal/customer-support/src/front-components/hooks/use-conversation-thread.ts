import { useCallback, useEffect, useRef, useState } from 'react';

import { SUPPORT_INBOX_MESSAGES_ROUTE_PATH } from '../../constants/crisp';
import {
  type SupportInboxConversation,
  type SupportInboxIssue,
  type SupportInboxMessage,
  type SupportInboxMessagesResult,
} from '../../types/support-inbox';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

// An open thread is where a reply is expected, so it refreshes faster than
// the list.
const REFRESH_INTERVAL_MS = 8_000;

type ThreadState = {
  conversationId: string;
  conversation: SupportInboxConversation;
  messages: SupportInboxMessage[];
  hasOlder: boolean;
  issues: SupportInboxIssue[];
};

const mergeMessages = (
  older: SupportInboxMessage[],
  newer: SupportInboxMessage[],
): SupportInboxMessage[] => {
  const byId = new Map<string, SupportInboxMessage>();

  for (const message of [...older, ...newer]) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort(
    (left, right) =>
      new Date(left.sentAt ?? 0).getTime() -
      new Date(right.sentAt ?? 0).getTime(),
  );
};

export const useConversationThread = (conversationId: string | null) => {
  const [thread, setThread] = useState<ThreadState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeConversationId = useRef(conversationId);

  activeConversationId.current = conversationId;

  const load = useCallback(
    async (
      targetConversationId: string,
      { isSilent }: { isSilent: boolean },
    ) => {
      if (!isSilent) {
        setIsLoading(true);
      }

      try {
        const result = await postAppRoute<SupportInboxMessagesResult>(
          SUPPORT_INBOX_MESSAGES_ROUTE_PATH,
          { conversationId: targetConversationId },
        );

        if (activeConversationId.current !== targetConversationId) {
          return;
        }

        // A refresh only brings the latest page; older pages the reader
        // already scrolled into are kept.
        setThread((previous) => ({
          conversationId: targetConversationId,
          conversation: result.conversation,
          messages:
            previous?.conversationId === targetConversationId
              ? mergeMessages(previous.messages, result.messages)
              : result.messages,
          hasOlder:
            previous?.conversationId === targetConversationId
              ? previous.hasOlder
              : result.hasOlder,
          issues: result.issues ?? [],
        }));
        setError(null);
      } catch (caught) {
        if (activeConversationId.current === targetConversationId) {
          setError(readErrorText(caught));
        }
      } finally {
        if (activeConversationId.current === targetConversationId) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (conversationId === null) {
      setThread(null);

      return;
    }

    void load(conversationId, { isSilent: false });

    const interval = setInterval(() => {
      void load(conversationId, { isSilent: true });
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [conversationId, load]);

  const loadOlder = async () => {
    if (thread === null || !thread.hasOlder || isLoadingOlder) {
      return;
    }

    const targetConversationId = thread.conversationId;
    const oldest = thread.messages[0]?.sentAt ?? null;

    setIsLoadingOlder(true);

    try {
      const result = await postAppRoute<SupportInboxMessagesResult>(
        SUPPORT_INBOX_MESSAGES_ROUTE_PATH,
        { conversationId: targetConversationId, before: oldest },
      );

      if (activeConversationId.current !== targetConversationId) {
        return;
      }

      setThread((previous) =>
        previous === null || previous.conversationId !== targetConversationId
          ? previous
          : {
              ...previous,
              messages: mergeMessages(result.messages, previous.messages),
              hasOlder: result.hasOlder,
            },
      );
    } catch (caught) {
      setError(readErrorText(caught));
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // A link or unlink answers with the full list, applied without waiting for
  // the next refresh.
  const replaceIssues = (issues: SupportInboxIssue[]) =>
    setThread((previous) =>
      previous === null ? previous : { ...previous, issues },
    );

  const isCurrent = thread?.conversationId === conversationId;

  return {
    conversation: isCurrent ? (thread?.conversation ?? null) : null,
    messages: isCurrent ? (thread?.messages ?? []) : [],
    hasOlder: isCurrent ? (thread?.hasOlder ?? false) : false,
    issues: isCurrent ? (thread?.issues ?? []) : [],
    replaceIssues,
    isLoading: isLoading || (conversationId !== null && !isCurrent),
    isLoadingOlder,
    error,
    loadOlder,
  };
};
