import { useParams, useSearchParams } from 'react-router-dom';

import { TaskManagerPageShell } from '@/task-manager/components/TaskManagerPageShell';
import { useTaskManagerIssueViews } from '@/task-manager/hooks/useTaskManagerIssueViews';
import { TaskManagerIssueDetail } from '@/task-manager/issue-detail/components/TaskManagerIssueDetail';

export const TaskManagerIssuePage = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const [searchParams] = useSearchParams();
  const { tableView } = useTaskManagerIssueViews();

  if (!tableView || !issueId) {
    return null;
  }

  return (
    <TaskManagerPageShell viewId={tableView.id}>
      <TaskManagerIssueDetail
        issueId={issueId}
        focusedCommentId={searchParams.get('commentId') ?? undefined}
      />
    </TaskManagerPageShell>
  );
};
