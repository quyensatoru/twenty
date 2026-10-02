import { useCallback, useEffect, useState } from 'react';

import { SEARCH_MERCHANTS_ROUTE_PATH } from '../../constants/route-paths';
import { postAppRoute } from '../utils/post-app-route.util';

export type MerchantOptionRow = { id: string; name?: string | null };

// Candidates for the merchant picker: the merchants of the project's app, never
// every merchant in the workspace. `merchant` is an app-scope root with no
// row-level predicate of its own, so the host's own picker could not narrow
// this at all — the route is the only place the rule exists.
export const useMerchantOptions = ({
  projectId,
  search,
}: {
  projectId: string | null;
  search: string;
}) => {
  const [merchants, setMerchants] = useState<MerchantOptionRow[]>([]);

  const load = useCallback(async () => {
    if (projectId === null) {
      setMerchants([]);

      return;
    }

    try {
      const result = await postAppRoute<{
        success: true;
        merchants?: MerchantOptionRow[];
      }>(SEARCH_MERCHANTS_ROUTE_PATH, { projectId, search });

      setMerchants(result.merchants ?? []);
    } catch {
      // Offering nothing is the safe failure: the links the issue already has
      // are rendered from the record, not from this list.
      setMerchants([]);
    }
  }, [projectId, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return merchants;
};
