import { useCallback, useEffect, useRef, useState } from 'react';

import { CLIENT_LIST_ROUTE_PATH } from '../../constants/route-paths';
import {
  type ClientListRequest,
  type ClientListResult,
} from '../../types/dashboard';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

// Keeps the last page on screen while the next one loads, so changing a
// filter or a page never blanks the table.
export const useDashboardClients = (request: ClientListRequest) => {
  const [data, setData] = useState<ClientListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestKey = useRef('');
  const requestKey = JSON.stringify(request);

  const reload = useCallback(async () => {
    const key = requestKey;

    latestKey.current = key;
    setIsLoading(true);

    try {
      const result = await postAppRoute<ClientListResult & { success: true }>(
        CLIENT_LIST_ROUTE_PATH,
        JSON.parse(key) as Record<string, unknown>,
      );

      if (latestKey.current === key) {
        setData(result);
        setError(null);
      }
    } catch (loadError) {
      if (latestKey.current === key) {
        setError(readErrorText(loadError));
      }
    } finally {
      if (latestKey.current === key) {
        setIsLoading(false);
      }
    }
  }, [requestKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, isLoading, error, reload };
};
