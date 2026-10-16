import { useCallback, useEffect, useRef, useState } from 'react';

import { DISCUSSION_STATE_ROUTE_PATH } from '../../constants/discussion';
import { UPDATE_ISSUE_ROUTE_PATH } from '../../constants/route-paths';
import { TASK_TODAY_ROUTE_PATH } from '../../constants/task-today';
import {
  type TaskTodayData,
  type TaskTodaySection,
} from '../../types/task-today';
import { getTaskTodayWindow } from '../utils/get-task-today-window.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

// Where the page opens: the most pressing queue that holds something, so the
// first screen is work rather than an empty Overdue tab.
const OPENING_SECTION_ORDER: readonly TaskTodaySection[] = [
  'overdue',
  'today',
  'inProgress',
  'upcoming',
  'noDueDate',
];

export const useTaskToday = () => {
  const [data, setData] = useState<TaskTodayData | null>(null);
  const [section, setSection] = useState<TaskTodaySection>('overdue');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIssueId, setBusyIssueId] = useState<string | null>(null);
  const [busyNotificationId, setBusyNotificationId] = useState<string | null>(
    null,
  );
  const requestGeneration = useRef(0);
  const isMounted = useRef(true);

  const load = useCallback(
    async (
      nextSection: TaskTodaySection,
      after?: string | null,
    ): Promise<TaskTodayData | null> => {
      const generation = ++requestGeneration.current;
      setSection(nextSection);
      setIsLoading(true);
      setError(null);
      try {
        const result = await postAppRoute<TaskTodayData>(
          TASK_TODAY_ROUTE_PATH,
          {
            ...getTaskTodayWindow(),
            section: nextSection,
            ...(after ? { after } : {}),
          },
        );
        if (generation !== requestGeneration.current) return null;
        setData((previous) => {
          if (
            !after ||
            previous?.section !== result.section ||
            previous.day !== result.day
          )
            return result;
          const previousIds = new Set(previous.issues.map((issue) => issue.id));
          return {
            ...result,
            issues: [
              ...previous.issues,
              ...result.issues.filter((issue) => !previousIds.has(issue.id)),
            ],
          };
        });
        return result;
      } catch (caught) {
        if (generation === requestGeneration.current)
          setError(readErrorText(caught));
        return null;
      } finally {
        if (generation === requestGeneration.current) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    isMounted.current = true;
    const open = async () => {
      const first = await load('overdue');
      const opening =
        first === null
          ? undefined
          : OPENING_SECTION_ORDER.find((key) => first.counts[key] > 0);

      if (opening !== undefined && opening !== 'overdue') {
        void load(opening);
      }
    };
    void open();
    return () => {
      isMounted.current = false;
      requestGeneration.current++;
    };
  }, [load]);

  const changeStatus = async (
    issueId: string,
    statusId: string,
    onSaved?: () => Promise<void>,
  ) => {
    setBusyIssueId(issueId);
    setError(null);
    try {
      await postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
        issueId,
        data: { statusId },
      });
      if (isMounted.current && onSaved) await onSaved();
      if (isMounted.current) await load(section);
      return true;
    } catch (caught) {
      if (isMounted.current) setError(readErrorText(caught));
      return false;
    } finally {
      if (isMounted.current) setBusyIssueId(null);
    }
  };

  const markRead = async (notificationId: string) => {
    setBusyNotificationId(notificationId);
    setError(null);
    try {
      await postAppRoute(DISCUSSION_STATE_ROUTE_PATH, {
        action: 'readNotification',
        notificationId,
      });
      if (isMounted.current) await load(section);
    } catch (caught) {
      if (isMounted.current) setError(readErrorText(caught));
    } finally {
      if (isMounted.current) setBusyNotificationId(null);
    }
  };

  return {
    data,
    section,
    isLoading,
    error,
    busyIssueId,
    busyNotificationId,
    load,
    changeStatus,
    markRead,
  };
};
