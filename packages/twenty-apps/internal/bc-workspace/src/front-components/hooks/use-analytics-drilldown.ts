import { useCallback, useEffect, useRef, useState } from 'react';

import { ANALYTICS_DRILLDOWN_ROUTE_PATH } from '../../constants/route-paths';
import {
  type AnalyticsMetricKey,
  type AnalyticsRequest,
  type DrilldownExport,
  type DrilldownResult,
} from '../../types/analytics';
import { type SortState } from '../../utils/sort-records.util';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

export const useAnalyticsDrilldown = ({
  request,
  metricKey,
  sort,
  page,
  search,
}: {
  request: AnalyticsRequest | null;
  metricKey: AnalyticsMetricKey | null;
  sort: SortState;
  page: number;
  search: string;
}) => {
  const [data, setData] = useState<DrilldownResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestKey = useRef('');
  const key =
    request === null || metricKey === null
      ? ''
      : JSON.stringify({ request, metricKey, sort, page, search });

  const load = useCallback(async () => {
    if (request === null || metricKey === null) {
      setData(null);

      return;
    }

    requestKey.current = key;
    setIsLoading(true);

    try {
      const result = await postAppRoute<{
        success: true;
        drilldown: DrilldownResult;
      }>(ANALYTICS_DRILLDOWN_ROUTE_PATH, {
        ...request,
        metricKey,
        sort,
        page,
        search,
      });

      if (requestKey.current === key) {
        setData(result.drilldown);
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
    void load();
  }, [load]);

  return { data, isLoading, error };
};

// The whole filtered and sorted set, for Copy as CSV.
export const loadDrilldownExport = async ({
  request,
  metricKey,
  sort,
  search,
}: {
  request: AnalyticsRequest;
  metricKey: AnalyticsMetricKey;
  sort: SortState;
  search: string;
}): Promise<DrilldownExport> => {
  const result = await postAppRoute<{ success: true; export: DrilldownExport }>(
    ANALYTICS_DRILLDOWN_ROUTE_PATH,
    { ...request, metricKey, sort, search, exportAll: true },
  );

  return result.export;
};
