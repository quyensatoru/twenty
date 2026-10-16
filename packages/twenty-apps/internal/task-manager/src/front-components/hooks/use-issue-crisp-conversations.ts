import { useEffect, useState } from 'react';

import { CUSTOMER_SUPPORT_ISSUE_CONVERSATIONS_ROUTE_PATH } from '../../constants/customer-support-routes';
import { postAppRoute } from '../utils/post-app-route.util';

export type IssueCrispConversation = {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  shopDomain: string | null;
  appName: string | null;
  status: string | null;
  waitingSince: string | null;
};

// Customer Support is optional, so an unavailable route reads as no links.
// An issue reaches its chats through its merchants, so the list is read again
// whenever the saved merchants change; the chats already shown stay up while
// that reload runs, and only another issue starts from an empty list.
export const useIssueCrispConversations = (
  issueId: string,
  merchantIds: readonly string[],
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<IssueCrispConversation[]>(
    [],
  );
  const [loadedIssueId, setLoadedIssueId] = useState(issueId);
  const merchantIdsKey = [...merchantIds].sort().join(',');

  if (loadedIssueId !== issueId) {
    setLoadedIssueId(issueId);
    setConversations([]);
    setIsLoading(true);
  }

  useEffect(() => {
    let isCurrent = true;

    postAppRoute<{ conversations?: IssueCrispConversation[] }>(
      CUSTOMER_SUPPORT_ISSUE_CONVERSATIONS_ROUTE_PATH,
      { issueId },
    )
      .then((result) => {
        if (isCurrent) {
          setConversations(result.conversations ?? []);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setConversations([]);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [issueId, merchantIdsKey]);

  return { conversations, isLoading };
};
