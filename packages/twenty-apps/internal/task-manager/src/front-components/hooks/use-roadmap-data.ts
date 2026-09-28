import { useCallback, useEffect, useState } from 'react';

import { ROADMAP_DATA_ROUTE_PATH } from '../../constants/route-paths';
import {
  type EpicRow,
  type IssueRow,
  type IssueStatusRow,
  type ProjectRow,
} from '../../types/task-manager-rows';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

type RoadmapData = {
  projects: ProjectRow[];
  project: ProjectRow | null;
  epics: EpicRow[];
  issues: IssueRow[];
  issueStatuses: IssueStatusRow[];
};

const EMPTY_ROADMAP: RoadmapData = {
  projects: [],
  project: null,
  epics: [],
  issues: [],
  issueStatuses: [],
};

export const useRoadmapData = ({ projectId }: { projectId?: string }) => {
  const [data, setData] = useState<RoadmapData>(EMPTY_ROADMAP);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const result = await postAppRoute<RoadmapData & { success: true }>(
        ROADMAP_DATA_ROUTE_PATH,
        projectId === undefined ? {} : { projectId },
      );

      setData({
        projects: result.projects ?? [],
        project: result.project ?? null,
        epics: result.epics ?? [],
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

  return { data, isLoading, loadError, reload };
};
