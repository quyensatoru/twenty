import { useCallback, useEffect, useState } from 'react';

import { BACKLOG_DATA_ROUTE_PATH } from '../../constants/route-paths';
import {
  type IssueRow,
  type IssueStatusRow,
  type ProjectRow,
  type SprintRow,
} from '../../types/task-manager-rows';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

type BacklogData = {
  projects: ProjectRow[];
  project: ProjectRow | null;
  sprints: SprintRow[];
  issues: IssueRow[];
  issueStatuses: IssueStatusRow[];
};

const EMPTY_BACKLOG: BacklogData = {
  projects: [],
  project: null,
  sprints: [],
  issues: [],
  issueStatuses: [],
};

export const useBacklogData = ({ projectId }: { projectId?: string }) => {
  const [data, setData] = useState<BacklogData>(EMPTY_BACKLOG);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const result = await postAppRoute<BacklogData & { success: true }>(
        BACKLOG_DATA_ROUTE_PATH,
        projectId === undefined ? {} : { projectId },
      );

      setData({
        projects: result.projects ?? [],
        project: result.project ?? null,
        sprints: result.sprints ?? [],
        issues: result.issues ?? [],
        issueStatuses: result.issueStatuses ?? [],
      });
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  }, [projectId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await reload();
      setIsLoading(false);
    };

    void load();
  }, [reload]);

  return { data, isLoading, loadError, reload, setData };
};
