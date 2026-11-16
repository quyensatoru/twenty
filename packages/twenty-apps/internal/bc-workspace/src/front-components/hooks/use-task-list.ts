import { useCallback, useEffect, useRef, useState } from 'react';

import { TASK_LIST_ROUTE_PATH } from '../../constants/route-paths';
import {
  type TaskListRequest,
  type TaskListResult,
  type TaskListRow,
} from '../../types/tasks';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

// The last answer stays on screen while the next one loads, so changing a
// filter or a page never blanks the table.
export const useTaskList = (request: TaskListRequest | null) => {
  const [data, setData] = useState<TaskListResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestKey = useRef('');
  const serialized = request === null ? null : JSON.stringify(request);

  const reload = useCallback(async () => {
    if (serialized === null) {
      return;
    }

    requestKey.current = serialized;
    setIsLoading(true);

    try {
      const result = await postAppRoute<TaskListResult & { success: true }>(
        TASK_LIST_ROUTE_PATH,
        JSON.parse(serialized) as Record<string, unknown>,
      );

      if (requestKey.current === serialized) {
        setData(result);
        setError(null);
      }
    } catch (loadError) {
      if (requestKey.current === serialized) {
        setError(readErrorText(loadError));
      }
    } finally {
      if (requestKey.current === serialized) {
        setIsLoading(false);
      }
    }
  }, [serialized]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const patchRow = (row: Pick<TaskListRow, 'id'> & Partial<TaskListRow>) =>
    setData((current) =>
      current === null
        ? current
        : {
            ...current,
            rows: current.rows.map((existing) =>
              existing.id === row.id ? { ...existing, ...row } : existing,
            ),
          },
    );

  return { data, isLoading, error, reload, patchRow };
};
