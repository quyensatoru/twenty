import { defineFrontComponent } from 'twenty-sdk/define';
import { t, useRecordId } from 'twenty-sdk/front-component';
import { IconPaperclip } from 'twenty-ui/icon';

import { ISSUE_ATTACHMENTS_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { TaskAttachmentRow } from './components/task-attachment-row';
import { TaskEmptyState } from './components/task-empty-state';
import { TaskSkeletonBar } from './components/task-skeleton';
import { TaskMessage } from './components/task-message';
import { TASK_TOKENS } from './components/task-tokens';
import { useIssueDetail } from './hooks/use-issue-detail';

// The files filed against issue.attachments: uploads from the host picker and
// pasted image URLs the composer stored. Read-only on purpose: the only path
// that can carry file bytes is the host's own picker in the Details widget,
// so this panel lists and links rather than offering an upload it cannot do.
const IssueAttachments = () => {
  const issueId = useRecordId();
  const { data, isLoading, loadError } = useIssueDetail(issueId);

  if (issueId === null) {
    return <TaskMessage text={t('No issue selected.')} />;
  }

  if (isLoading && data.issue === null) {
    return (
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontFamily: TASK_TOKENS.fontFamily,
          gap: 4,
          height: '100%',
          minHeight: 0,
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <TaskSkeletonBar
          height={40}
          background={TASK_TOKENS.backgroundSecondary}
          radius={TASK_TOKENS.radius}
          style={{ border: `1px solid ${TASK_TOKENS.borderLight}` }}
        />
        <TaskSkeletonBar
          height={40}
          width="70%"
          background={TASK_TOKENS.backgroundSecondary}
          radius={TASK_TOKENS.radius}
          style={{ border: `1px solid ${TASK_TOKENS.borderLight}` }}
        />
      </section>
    );
  }

  if (data.issue === null) {
    return (
      <TaskMessage
        text={loadError ?? t('This issue is not available to you.')}
        tone={loadError === null ? 'neutral' : 'danger'}
      />
    );
  }

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 4,
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
        width: '100%',
      }}
    >
      {data.attachments.length === 0 ? (
        <TaskEmptyState
          icon={<IconPaperclip size={16} />}
          title={t('No attachments yet')}
          description={t(
            'Files attached to this issue will appear here for quick access.',
          )}
        />
      ) : (
        data.attachments.map((row) => (
          <TaskAttachmentRow key={row.fileId} row={row} />
        ))
      )}
    </section>
  );
};

export default defineFrontComponent({
  universalIdentifier: ISSUE_ATTACHMENTS_FRONT_COMPONENT_UID,
  name: 'issue-attachments',
  description:
    "An issue's attached files, listed through the app's scoped routes.",
  component: IssueAttachments,
});
