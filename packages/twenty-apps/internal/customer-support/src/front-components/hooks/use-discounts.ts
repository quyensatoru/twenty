import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DISCOUNT_CONSOLE_DETAIL_ROUTE_PATH,
  DISCOUNT_CONSOLE_LIST_ROUTE_PATH,
} from '../../constants/discount';
import {
  type DiscountDetailResult,
  type DiscountListItem,
  type DiscountListResult,
} from '../../types/discount';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

// A delivery answers within seconds; while any discount is still being sent
// the list checks back quickly, otherwise at the pace of a glance.
const IDLE_REFRESH_MS = 30_000;
const SENDING_REFRESH_MS = 2_000;

export const useDiscounts = () => {
  const [data, setData] = useState<DiscountListResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const current = ++generation.current;

    try {
      const result = await postAppRoute<DiscountListResult & {
        success: true;
      }>(DISCOUNT_CONSOLE_LIST_ROUTE_PATH, {});

      if (current === generation.current) {
        setData(result);
        setError(null);
      }
    } catch (caught) {
      if (current === generation.current) {
        setError(readErrorText(caught));
      }
    } finally {
      if (current === generation.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const isSending =
    data?.discounts.some((discount) => discount.syncStatus === 'PENDING') ===
    true;

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(
      () => {
        void load();
      },
      isSending ? SENDING_REFRESH_MS : IDLE_REFRESH_MS,
    );

    return () => clearInterval(interval);
  }, [isSending, load]);

  // Shows a save or resend at once instead of after the next refresh.
  const upsertLocal = (discount: DiscountListItem) => {
    setData((previous) =>
      previous === null
        ? previous
        : {
            ...previous,
            discounts: previous.discounts.some(
              (item) => item.id === discount.id,
            )
              ? previous.discounts.map((item) =>
                  item.id === discount.id ? discount : item,
                )
              : [discount, ...previous.discounts],
          },
    );
  };

  const removeLocal = (discountId: string) => {
    setData((previous) =>
      previous === null
        ? previous
        : {
            ...previous,
            discounts: previous.discounts.filter(
              (item) => item.id !== discountId,
            ),
          },
    );
  };

  return { data, error, isLoading, reload: load, upsertLocal, removeLocal };
};

export const useDiscountDetail = (
  discountId: string | null,
  refreshKey: string,
) => {
  const [detail, setDetail] = useState<DiscountDetailResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (discountId === null) {
      setDetail(null);
      return;
    }

    let isCurrent = true;

    postAppRoute<DiscountDetailResult & { success: true }>(
      DISCOUNT_CONSOLE_DETAIL_ROUTE_PATH,
      { discountId },
    )
      .then((result) => {
        if (isCurrent) {
          setDetail(result);
          setError(null);
        }
      })
      .catch((caught) => {
        if (isCurrent) {
          setError(readErrorText(caught));
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [discountId, refreshKey]);

  return { detail: detail?.discount.id === discountId ? detail : null, error };
};
