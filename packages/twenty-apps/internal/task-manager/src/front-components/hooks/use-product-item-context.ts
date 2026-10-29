import { useCallback, useEffect, useState } from 'react';

import { PRODUCT_ITEM_ROUTE_PATH } from '../../constants/product-backlog';
import {
  type LinkedIssueSummary,
  type ProductBacklogSettings,
} from '../../types/product-backlog';
import { readProductBacklogSettings } from '../../utils/read-product-backlog-settings.util';
import { postAppRoute } from '../utils/post-app-route.util';

export type ProductItemContext = {
  settings: ProductBacklogSettings;
  doneStatusIds: ReadonlySet<string>;
  linkedIssues: LinkedIssueSummary[];
  canWrite: boolean;
};

// What an issue's product side needs beyond the issue itself. Null while
// loading and for a reader the Product Backlog is hidden from.
export const useProductItemContext = (
  issueId: string,
  blockerIds: readonly string[],
) => {
  // Tagged with its issue, so stepping to the next card never shows the
  // previous card's context while the new one loads.
  const [loaded, setLoaded] = useState<{
    issueId: string;
    context: ProductItemContext | null;
  } | null>(null);
  const blockerIdsKey = blockerIds.join(',');

  const load = useCallback(async () => {
    try {
      const result = await postAppRoute<
        Record<string, unknown> & { success: true }
      >(PRODUCT_ITEM_ROUTE_PATH, { issueId });

      if (result.access === 'NONE') {
        setLoaded({ issueId, context: null });

        return;
      }

      setLoaded({
        issueId,
        context: {
          settings: readProductBacklogSettings(result.settings),
          doneStatusIds: new Set(
            Array.isArray(result.doneStatusIds)
              ? (result.doneStatusIds as string[])
              : [],
          ),
          linkedIssues: Array.isArray(result.linkedIssues)
            ? (result.linkedIssues as LinkedIssueSummary[])
            : [],
          canWrite: result.canWrite === true,
        },
      });
    } catch {
      setLoaded({ issueId, context: null });
    }
    // Blockers are re-read when the list of ids changes, not on every edit.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId, blockerIdsKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return loaded?.issueId === issueId ? loaded.context : null;
};
