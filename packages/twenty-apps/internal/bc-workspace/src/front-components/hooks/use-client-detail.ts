import { useCallback, useEffect, useRef, useState } from 'react';

import { CLIENT_DETAIL_ROUTE_PATH } from '../../constants/route-paths';
import { type ClientDetailResult } from '../../types/dashboard';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

export const useClientDetail = (vipClientId: string) => {
  const [detail, setDetail] = useState<ClientDetailResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latestId = useRef(vipClientId);

  const reload = useCallback(async () => {
    latestId.current = vipClientId;

    try {
      const result = await postAppRoute<ClientDetailResult & { success: true }>(
        CLIENT_DETAIL_ROUTE_PATH,
        { vipClientId },
      );

      if (latestId.current === vipClientId) {
        setDetail(result);
        setError(null);
      }
    } catch (loadError) {
      if (latestId.current === vipClientId) {
        setError(readErrorText(loadError));
      }
    }
  }, [vipClientId]);

  useEffect(() => {
    setDetail(null);
    setError(null);
    void reload();
  }, [reload]);

  return { detail, error, reload };
};
