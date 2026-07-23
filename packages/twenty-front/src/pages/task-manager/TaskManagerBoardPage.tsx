import { TaskManagerBoard } from '@/task-manager/board/components/TaskManagerBoard';
import { TaskManagerPageShell } from '@/task-manager/components/TaskManagerPageShell';
import { useTaskManagerIssueViews } from '@/task-manager/hooks/useTaskManagerIssueViews';

export const TaskManagerBoardPage = () => {
  const { kanbanView } = useTaskManagerIssueViews();

  if (!kanbanView) {
    return null;
  }

  return (
    <TaskManagerPageShell viewId={kanbanView.id}>
      <TaskManagerBoard />
    </TaskManagerPageShell>
  );
};
