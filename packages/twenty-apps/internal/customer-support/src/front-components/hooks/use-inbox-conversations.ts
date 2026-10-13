import { useCallback, useEffect, useRef, useState } from 'react';

import {
  SUPPORT_INBOX_CONVERSATIONS_ROUTE_PATH,
  SUPPORT_INBOX_SYNC_ROUTE_PATH,
} from '../../constants/crisp';
import {
  type SupportInboxConversationsResult,
  type SupportInboxSyncResult,
  type SupportInboxTab,
} from '../../types/support-inbox';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

// New chats land through the web hook within seconds; the list follows at the
// same pace a person glances back at it.
const REFRESH_INTERVAL_MS = 20_000;

export type InboxFilters = {
  tab: SupportInboxTab;
  appName: string | null;
  search: string;
};

export const useInboxConversations = (filters: InboxFilters) => {
  const [data, setData] = useState<SupportInboxConversationsResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);
  const filtersRef = useRef(filters);

  filtersRef.current = filters;

  const load = useCallback(async ({ isSilent }: { isSilent: boolean }) => {
    const generation = ++requestGeneration.current;
    const current = filtersRef.current;

    if (!isSilent) {
      setIsLoading(true);
    }

    try {
      const result = await postAppRoute<SupportInboxConversationsResult>(
        SUPPORT_INBOX_CONVERSATIONS_ROUTE_PATH,
        {
          tab: current.tab,
          appName: current.appName,
          search: current.search,
        },
      );

      if (generation !== requestGeneration.current) {
        return;
      }

      setData(result);
      setError(null);
    } catch (caught) {
      if (generation === requestGeneration.current) {
        setError(readErrorText(caught));
      }
    } finally {
      if (generation === requestGeneration.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load({ isSilent: false });
  }, [filters.tab, filters.appName, filters.search, load]);

  useEffect(() => {
    const interval = setInterval(() => {
      void load({ isSilent: true });
    }, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      requestGeneration.current++;
    };
  }, [load]);

  const loadMore = async () => {
    if (data === null || !data.hasNextPage || isLoadingMore) {
      return;
    }

    const generation = requestGeneration.current;

    setIsLoadingMore(true);

    try {
      const result = await postAppRoute<SupportInboxConversationsResult>(
        SUPPORT_INBOX_CONVERSATIONS_ROUTE_PATH,
        { ...filtersRef.current, after: data.endCursor },
      );

      if (generation !== requestGeneration.current) {
        return;
      }

      setData((previous) => {
        if (previous === null) {
          return result;
        }

        const knownIds = new Set(
          previous.conversations.map((conversation) => conversation.id),
        );

        return {
          ...previous,
          conversations: [
            ...previous.conversations,
            ...result.conversations.filter(
              (conversation) => !knownIds.has(conversation.id),
            ),
          ],
          endCursor: result.endCursor,
          hasNextPage: result.hasNextPage,
        };
      });
    } catch (caught) {
      setError(readErrorText(caught));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const requestSync = async (days?: number): Promise<boolean> => {
    setIsSyncing(true);

    try {
      const result = await postAppRoute<SupportInboxSyncResult>(
        SUPPORT_INBOX_SYNC_ROUTE_PATH,
        days === undefined ? {} : { days },
      );

      return result.queued;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    data,
    isLoading,
    isLoadingMore,
    isSyncing,
    error,
    refresh: () => load({ isSilent: true }),
    loadMore,
    requestSync,
  };
};
