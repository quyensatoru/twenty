import { TaskManagerPageShell } from '@/task-manager/components/TaskManagerPageShell';
import { useTaskManagerIssueViews } from '@/task-manager/hooks/useTaskManagerIssueViews';
import { TaskManagerIssueDetail } from '@/task-manager/issue-detail/components/TaskManagerIssueDetail';

type SidePanelTaskManagerIssueViewProps = {
  issueId: string;
};

export const SidePanelTaskManagerIssueView = ({
  issueId,
}: SidePanelTaskManagerIssueViewProps) => {
  const { tableView } = useTaskManagerIssueViews();

  if (!tableView) {
    return null;
  }

  return (
    <TaskManagerPageShell viewId={tableView.id}>
      <TaskManagerIssueDetail issueId={issueId} isInSidePanel />
    </TaskManagerPageShell>
  );
};
