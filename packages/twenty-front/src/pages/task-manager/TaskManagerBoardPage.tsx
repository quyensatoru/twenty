import { useSearchParams } from 'react-router-dom';

import { isDefined } from 'twenty-shared/utils';

import { TaskManagerBoard } from '@/task-manager/board/components/TaskManagerBoard';
import { TaskManagerPageShell } from '@/task-manager/components/TaskManagerPageShell';
import { useTaskManagerIssueViews } from '@/task-manager/hooks/useTaskManagerIssueViews';

export const TaskManagerBoardPage = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') ?? undefined;

  const { kanbanView } = useTaskManagerIssueViews({ projectId });

  if (!isDefined(kanbanView)) {
    return null;
  }

  return (
    <TaskManagerPageShell viewId={kanbanView.id}>
      <TaskManagerBoard />
    </TaskManagerPageShell>
  );
};
