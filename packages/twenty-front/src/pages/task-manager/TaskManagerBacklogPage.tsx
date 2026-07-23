import { TaskManagerBacklog } from '@/task-manager/backlog/components/TaskManagerBacklog';
import { TaskManagerPageShell } from '@/task-manager/components/TaskManagerPageShell';
import { useTaskManagerIssueViews } from '@/task-manager/hooks/useTaskManagerIssueViews';

export const TaskManagerBacklogPage = () => {
  const { tableView } = useTaskManagerIssueViews();

  if (!tableView) {
    return null;
  }

  return (
    <TaskManagerPageShell viewId={tableView.id}>
      <TaskManagerBacklog />
    </TaskManagerPageShell>
  );
};
