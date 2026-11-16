import { useCallback, useEffect, useRef, useState } from 'react';

import { TASK_DETAIL_ROUTE_PATH } from '../../constants/route-paths';
import { type TaskDetail, type TaskDetailResult } from '../../types/tasks';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';

export const useTaskDetail = (taskId: string) => {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestedId = useRef(taskId);

  const reload = useCallback(async () => {
    requestedId.current = taskId;

    try {
      const result = await postAppRoute<TaskDetailResult & { success: true }>(
        TASK_DETAIL_ROUTE_PATH,
        { taskId },
      );

      if (requestedId.current === taskId) {
        setTask(result.task);
        setError(null);
      }
    } catch (loadError) {
      if (requestedId.current === taskId) {
        setError(readErrorText(loadError));
      }
    }
  }, [taskId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { task, error, reload, setTask };
};
