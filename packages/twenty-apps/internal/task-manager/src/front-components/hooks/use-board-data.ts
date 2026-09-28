import { useCallback, useEffect, useState } from 'react';

import { BOARD_DATA_ROUTE_PATH } from '../../constants/route-paths';
import {
  type IssueRow,
  type IssueStatusRow,
  type ProjectRow,
  type SprintRow,
} from '../../types/task-manager-rows';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

type BoardData = {
  projects: ProjectRow[];
  project: ProjectRow | null;
  issueStatuses: IssueStatusRow[];
  sprints: SprintRow[];
  sprintId: string | null;
  issues: IssueRow[];
};

const EMPTY_BOARD: BoardData = {
  projects: [],
  project: null,
  issueStatuses: [],
  sprints: [],
  sprintId: null,
  issues: [],
};

export const useBoardData = ({
  projectId,
  sprintId,
}: {
  projectId?: string;
  sprintId?: string | null;
}) => {
  const [data, setData] = useState<BoardData>(EMPTY_BOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const result = await postAppRoute<BoardData & { success: true }>(
        BOARD_DATA_ROUTE_PATH,
        {
          ...(projectId === undefined ? {} : { projectId }),
          ...(sprintId === undefined ? {} : { sprintId }),
        },
      );

      setData({
        projects: result.projects ?? [],
        project: result.project ?? null,
        issueStatuses: result.issueStatuses ?? [],
        sprints: result.sprints ?? [],
        sprintId: result.sprintId ?? null,
        issues: result.issues ?? [],
      });
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  }, [projectId, sprintId]);

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
