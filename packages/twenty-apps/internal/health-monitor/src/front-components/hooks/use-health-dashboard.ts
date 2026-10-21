import { useCallback, useEffect, useRef, useState } from 'react';

import { HEALTH_DASHBOARD_ROUTE_PATH } from '../../constants/route-paths';
import { type HealthDashboardResult } from '../../types/health-route-results';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

const REFRESH_MS = 60_000;

// Refreshes once a minute, the cron's own cadence, so the page stays live
// without the reader reloading it.
export const useHealthDashboard = (
  monitorId: string | null,
  rangeHours: number,
) => {
  const [data, setData] = useState<HealthDashboardResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestKey = useRef('');

  const reload = useCallback(
    async ({ isBackground = false }: { isBackground?: boolean } = {}) => {
      if (monitorId === null) {
        setData(null);

        return;
      }

      const key = `${monitorId}:${rangeHours}`;

      requestKey.current = key;

      if (!isBackground) {
        setIsLoading(true);
      }

      try {
        const result = await postAppRoute<HealthDashboardResult>(
          HEALTH_DASHBOARD_ROUTE_PATH,
          { monitorId, rangeHours },
        );

        if (requestKey.current === key) {
          setData(result);
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
    },
    [monitorId, rangeHours],
  );

  useEffect(() => {
    void reload();

    const timer = setInterval(
      () => void reload({ isBackground: true }),
      REFRESH_MS,
    );

    return () => clearInterval(timer);
  }, [reload]);

  return { data, isLoading, error, reload };
};
