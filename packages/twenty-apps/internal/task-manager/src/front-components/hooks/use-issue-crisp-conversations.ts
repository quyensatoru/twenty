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
export const useIssueCrispConversations = (issueId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<IssueCrispConversation[]>(
    [],
  );

  useEffect(() => {
    let isCurrent = true;

    setConversations([]);
    setIsLoading(true);

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
  }, [issueId]);

  return { conversations, isLoading };
};
