import { useMemo } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  openSidePanelPage,
  SidePanelPages,
  t,
  useRecordId,
} from 'twenty-sdk/front-component';

import { ISSUE_SUBTASKS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { TASK_EMPTY_FEED_STYLE } from './components/task-control-styles';
import { TaskMessage } from './components/task-message';
import { TaskSubtaskRow } from './components/task-subtask-row';
import { TASK_TOKENS } from './components/task-tokens';
import {
  type LinkedIssueRow,
  type MemberRow,
  useIssueDetail,
} from './hooks/use-issue-detail';
import { readMemberName } from './utils/read-member-name.util';

// The issue above this one and the issues below it. Read-only on purpose:
// creating a child needs its project and its key allocation, which is the
// board's job, not a panel's.
const IssueSubtasks = () => {
  const issueId = useRecordId();
  const { data, isLoading, loadError } = useIssueDetail(issueId);

  const membersById = useMemo(
    () => new Map<string, MemberRow>(data.members.map((m) => [m.id, m])),
    [data.members],
  );

  const statusById = useMemo(() => {
    const map = new Map<string, { name: string; color?: string | null }>();

    for (const status of data.issueStatuses) {
      if (typeof status.name === 'string') {
        map.set(status.id, { name: status.name, color: status.color });
      }
    }

    return map;
  }, [data.issueStatuses]);

  if (issueId === null) {
    return <TaskMessage text={t('No issue selected.')} />;
  }

  if (isLoading && data.issue === null) {
    return null;
  }

  if (data.issue === null) {
    return (
      <TaskMessage
        text={loadError ?? t('This issue is not available to you.')}
        tone={loadError === null ? 'neutral' : 'danger'}
      />
    );
  }

  const openIssue = (recordId: string) =>
    void openSidePanelPage({
      page: SidePanelPages.ViewRecord,
      objectNameSingular: 'issue',
      recordId,
    });

  const renderRow = (row: LinkedIssueRow) => {
    const status = statusById.get(row.statusId ?? '');
    const owner =
      typeof row.assigneeId === 'string'
        ? membersById.get(row.assigneeId)
        : undefined;

    return (
      <TaskSubtaskRow
        key={row.id}
        row={row}
        statusName={status?.name ?? null}
        statusColor={status?.color}
        ownerName={
          typeof row.assigneeId === 'string'
            ? readMemberName(membersById, row.assigneeId, t('Unknown'))
            : null
        }
        ownerAvatarUrl={owner?.avatarUrl}
        onOpen={() => openIssue(row.id)}
      />
    );
  };

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 8,
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
        width: '100%',
      }}
    >
      {data.parentIssue !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              fontSize: 11,
              padding: '0 8px',
            }}
          >
            {t('Parent issue')}
          </span>
          {renderRow(data.parentIssue)}
        </div>
      )}
      {data.childIssues.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.childIssues.map(renderRow)}
        </div>
      )}
      {data.parentIssue === null && data.childIssues.length === 0 && (
        <div style={TASK_EMPTY_FEED_STYLE}>{t('No subtasks yet.')}</div>
      )}
    </section>
  );
};

export default defineFrontComponent({
  universalIdentifier: ISSUE_SUBTASKS_FRONT_COMPONENT_UID,
  name: 'issue-subtasks',
  description:
    "An issue's parent and child issues, opened beside the record through the app's scoped routes.",
  component: IssueSubtasks,
});
