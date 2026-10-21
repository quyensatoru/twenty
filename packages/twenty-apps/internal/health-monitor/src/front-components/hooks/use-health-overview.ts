import { useCallback, useEffect, useState } from 'react';

import { HEALTH_OVERVIEW_ROUTE_PATH } from '../../constants/route-paths';
import { type HealthOverviewResult } from '../../types/health-route-results';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

export const useHealthOverview = (appId: string | null = null) => {
  const [data, setData] = useState<HealthOverviewResult>({
    apps: [],
    dashboardPageLayoutId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(
        await postAppRoute<HealthOverviewResult>(
          HEALTH_OVERVIEW_ROUTE_PATH,
          appId === null ? {} : { appId },
        ),
      );
      setError(null);
    } catch (loadError) {
      setError(readErrorText(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...data, isLoading, error, reload };
};
