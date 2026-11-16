import { useCallback, useEffect, useState } from 'react';

import { CONTEXT_ROUTE_PATH } from '../../constants/route-paths';
import { type BcContextResult } from '../../types/bc-context';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

export const useBcContext = () => {
  const [context, setContext] = useState<BcContextResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const result = await postAppRoute<BcContextResult & { success: true }>(
        CONTEXT_ROUTE_PATH,
        {},
      );

      setContext(result);
      setError(null);
    } catch (loadError) {
      setError(readErrorText(loadError));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { context, error, isLoading: context === null && error === null, reload };
};
