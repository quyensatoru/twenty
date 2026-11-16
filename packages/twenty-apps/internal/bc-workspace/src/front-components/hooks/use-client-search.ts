import { useEffect, useRef, useState } from 'react';

import { CLIENT_SEARCH_ROUTE_PATH } from '../../constants/route-paths';
import {
  type ClientSearchItem,
  type ClientSearchResult,
} from '../../types/tasks';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

// Debounced so typing a domain sends one bounded query, not one per key.
export const useClientSearch = (query: string) => {
  const [clients, setClients] = useState<ClientSearchItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestQuery = useRef(query);
  const trimmed = query.trim();

  useEffect(() => {
    latestQuery.current = trimmed;

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setClients([]);
      setHasMore(false);
      setIsSearching(false);

      return;
    }

    setIsSearching(true);

    const timer = setTimeout(() => {
      void postAppRoute<ClientSearchResult & { success: true }>(
        CLIENT_SEARCH_ROUTE_PATH,
        { query: trimmed, limit: 20 },
      )
        .then((result) => {
          if (latestQuery.current === trimmed) {
            setClients(result.clients);
            setHasMore(result.hasMore === true);
            setError(null);
          }
        })
        .catch((searchError) => {
          if (latestQuery.current === trimmed) {
            setError(readErrorText(searchError));
          }
        })
        .finally(() => {
          if (latestQuery.current === trimmed) {
            setIsSearching(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed]);

  return {
    clients,
    hasMore,
    isSearching,
    error,
    isQueryTooShort: trimmed.length < MIN_QUERY_LENGTH,
  };
};
