import { useEffect, useState } from 'react';

import { CUSTOMER_SUPPORT_MERCHANT_CONVERSATIONS_ROUTE_PATH } from '../../constants/customer-support-routes';
import { MERCHANT_PREVIEW_ROUTE_PATH } from '../../constants/route-paths';
import {
  type SupportInboxConversation,
  type SupportInboxIssue,
} from '../support-conversation/types/support-inbox';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

type MerchantPreviewState = {
  issues: SupportInboxIssue[];
  // null when Customer Support is not installed or its route failed: the
  // section is left out rather than shown empty.
  conversations: SupportInboxConversation[] | null;
  isLoading: boolean;
  error: string | null;
};

const INITIAL_STATE: MerchantPreviewState = {
  issues: [],
  conversations: null,
  isLoading: true,
  error: null,
};

export const useMerchantPreview = (merchantId: string) => {
  const [state, setState] = useState<MerchantPreviewState>(INITIAL_STATE);

  useEffect(() => {
    let isCurrent = true;

    setState(INITIAL_STATE);

    void Promise.allSettled([
      postAppRoute<{ success: true; issues: SupportInboxIssue[] }>(
        MERCHANT_PREVIEW_ROUTE_PATH,
        { merchantId },
      ),
      postAppRoute<{
        success: true;
        conversations: SupportInboxConversation[];
      }>(CUSTOMER_SUPPORT_MERCHANT_CONVERSATIONS_ROUTE_PATH, { merchantId }),
    ]).then(([preview, conversations]) => {
      if (!isCurrent) {
        return;
      }

      setState({
        issues: preview.status === 'fulfilled' ? preview.value.issues : [],
        conversations:
          conversations.status === 'fulfilled'
            ? conversations.value.conversations
            : null,
        isLoading: false,
        error:
          preview.status === 'rejected' ? readErrorText(preview.reason) : null,
      });
    });

    return () => {
      isCurrent = false;
    };
  }, [merchantId]);

  return state;
};
