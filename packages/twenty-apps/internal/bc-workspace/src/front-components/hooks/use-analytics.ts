import { useCallback, useEffect, useRef, useState } from 'react';

import { ANALYTICS_ROUTE_PATH } from '../../constants/route-paths';
import {
  type AnalyticsRequest,
  type AnalyticsResult,
} from '../../types/analytics';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

// The last answer stays on screen while a new filter loads, so the page does
// not collapse and jump on every change.
export const useAnalytics = (request: AnalyticsRequest | null) => {
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestKey = useRef('');
  const key = request === null ? '' : JSON.stringify(request);

  const reload = useCallback(async () => {
    if (request === null) {
      return;
    }

    requestKey.current = key;
    setIsLoading(true);

    try {
      const result = await postAppRoute<{
        success: true;
        analytics: AnalyticsResult;
      }>(ANALYTICS_ROUTE_PATH, request as unknown as Record<string, unknown>);

      if (requestKey.current === key) {
        setData(result.analytics);
        setError(null);
      }
    } catch (loadError) {
      if (requestKey.current === key) {
        setError(readErrorText(loadError));
      }
    } finally {
      if (requestKey.current === key) {
        setIsLoading(false);
      }
    }
  }, [key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, isLoading, error, reload };
};
