import { useCallback, useEffect, useState } from 'react';

import {
  HEALTH_CONFIG_ROUTE_PATH,
  SAVE_HEALTH_CONFIG_ROUTE_PATH,
} from '../../constants/route-paths';
import { type HealthMonitorConfig } from '../../types/health-monitor-config';
import { type HealthConfigResult } from '../../types/health-route-results';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

export const useHealthConfig = (appId: string | null) => {
  const [data, setData] = useState<HealthConfigResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (appId === null) {
      return;
    }

    setIsLoading(true);

    try {
      setData(
        await postAppRoute<HealthConfigResult>(HEALTH_CONFIG_ROUTE_PATH, {
          appId,
        }),
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

  const save = async (config: HealthMonitorConfig): Promise<string | null> => {
    if (appId === null) {
      return null;
    }

    const result = await postAppRoute<{ monitorId?: string | null }>(
      SAVE_HEALTH_CONFIG_ROUTE_PATH,
      { appId, config },
    );

    return result.monitorId ?? null;
  };

  return { data, isLoading, error, reload, save };
};
