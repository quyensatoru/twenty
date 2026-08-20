import { useSearchParams } from 'react-router-dom';

import { TASK_MANAGER_SEARCH_PARAM } from '@/task-manager/constants/TaskManagerSearchParam';

// Board, Backlog and Roadmap all read the query from the URL so that it
// survives tab switches (TaskManagerTopBar forwards search params on navigate).
export const useTaskManagerSearchQuery = (): string => {
  const [searchParams] = useSearchParams();

  return searchParams.get(TASK_MANAGER_SEARCH_PARAM)?.trim() ?? '';
};
