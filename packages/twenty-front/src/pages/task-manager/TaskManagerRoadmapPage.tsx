import { TaskManagerPageShell } from '@/task-manager/components/TaskManagerPageShell';
import { useTaskManagerIssueViews } from '@/task-manager/hooks/useTaskManagerIssueViews';
import { TaskManagerRoadmap } from '@/task-manager/roadmap/components/TaskManagerRoadmap';

export const TaskManagerRoadmapPage = () => {
  const { tableView } = useTaskManagerIssueViews();

  if (!tableView) {
    return null;
  }

  return (
    <TaskManagerPageShell viewId={tableView.id}>
      <TaskManagerRoadmap />
    </TaskManagerPageShell>
  );
};
