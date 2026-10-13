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

// Read once per issue. Any failure, including the Customer Support app not
// being installed, reads as "no conversations" and the row stays hidden.
export const useIssueCrispConversations = (issueId: string) => {
  const [conversations, setConversations] = useState<IssueCrispConversation[]>(
    [],
  );

  useEffect(() => {
    let isCurrent = true;

    setConversations([]);

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
      });

    return () => {
      isCurrent = false;
    };
  }, [issueId]);

  return conversations;
};
