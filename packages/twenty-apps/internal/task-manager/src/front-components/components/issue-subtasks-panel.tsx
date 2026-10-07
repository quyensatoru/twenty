import { useMemo, useState } from 'react';
import {
  enqueueSnackbar,
  openSidePanelPage,
  SidePanelPages,
  t,
  useRecordId,
} from 'twenty-sdk/front-component';
import { IconStack2 } from 'twenty-ui/icon';

import { CREATE_ISSUE_ROUTE_PATH, UPDATE_ISSUE_ROUTE_PATH } from '../../constants/route-paths';
import { type BoardIssue } from '../../types/task-board';
import { TaskEmptyState } from './task-empty-state';
import { TaskIssueSearch } from './task-issue-search';
import { TaskSkeletonBar } from './task-skeleton';
import { TaskMessage } from './task-message';
import { TaskStatusLine } from './task-status-line';
import { TaskSubtaskRow } from './task-subtask-row';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';
import {
  type LinkedIssueRow,
  type MemberRow,
  useIssueDetail,
} from '../hooks/use-issue-detail';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { readMemberName } from '../utils/read-member-name.util';

// The issue above this one and the issues below it, with the same unified
// box the board modal uses: typing links what exists, the Create row (or
// Enter on no match) creates, and every row carries an unlink X. Detaching
// only clears the parent pointer — nothing is ever deleted from here.
//
// Shared between its own widget and the record page's unified left column, so
// this lives outside the front-component file: the app build strips named
// exports out of `*.front-component.tsx`.
export const IssueSubtasks = () => {
  const issueId = useRecordId();
  const { data, isLoading, loadError, reload } = useIssueDetail(issueId);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  // Rows the link search must never offer: this issue, its children and its
  // parent — any of them would loop the parent chain. Up here with the other
  // memos, never below the early returns: a hook after a return changes the
  // hook count once data arrives, and React answers error #310.
  const unlinkableIds = useMemo(() => {
    if (issueId === null) {
      return [];
    }

    const ids = new Set<string>([issueId]);

    if (
      data.parentIssue !== null &&
      typeof data.parentIssue.id === 'string'
    ) {
      ids.add(data.parentIssue.id);
    }

    for (const child of data.childIssues) {
      ids.add(child.id);
    }

    return [...ids];
  }, [issueId, data.parentIssue, data.childIssues]);

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
          gap: 8,
          height: '100%',
          minHeight: 0,
          overflowY: 'auto',
          ...TASK_THIN_SCROLLBAR_STYLE,
          width: '100%',
        }}
      >
        <TaskSkeletonBar
          height={38}
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

  const openIssue = (recordId: string) =>
    void openSidePanelPage({
      page: SidePanelPages.ViewRecord,
      objectNameSingular: 'issue',
      recordId,
    });

  const projectId =
    typeof data.issue?.projectId === 'string' ? data.issue.projectId : null;

  const createSubtask = () => {
    const title = subtaskDraft.trim();

    if (title === '' || projectId === null || issueId === null) {
      return;
    }

    setIsSaving(true);
    postAppRoute(CREATE_ISSUE_ROUTE_PATH, {
      projectId,
      data: {
        title,
        issueType: 'SUBTASK',
        parentId: issueId,
        statusId: data.issue?.statusId ?? null,
      },
    })
      .then(() => {
        setSubtaskDraft('');
        setActionError(null);
        return reload();
      })
      .catch((error: unknown) => {
        const message = readErrorText(error);
        setActionError(message);
        void enqueueSnackbar({ message, variant: 'error' });
      })
      .finally(() => setIsSaving(false));
  };

  const linkSubtask = (picked: BoardIssue) => {
    setSubtaskDraft('');
    setIsSaving(true);
    postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
      issueId: picked.id,
      data: { parentId: issueId },
    })
      .then(() => {
        setActionError(null);
        return reload();
      })
      .catch((error: unknown) => {
        const message = readErrorText(error);
        setActionError(message);
        void enqueueSnackbar({ message, variant: 'error' });
      })
      .finally(() => setIsSaving(false));
  };

  const unlinkSubtask = (childId: string) => {
    setIsSaving(true);
    postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
      issueId: childId,
      data: { parentId: null },
    })
      .then(() => {
        setActionError(null);
        return reload();
      })
      .catch((error: unknown) => {
        const message = readErrorText(error);
        setActionError(message);
        void enqueueSnackbar({ message, variant: 'error' });
      })
      .finally(() => setIsSaving(false));
  };

  const detachParent = () => {
    if (issueId === null) {
      return;
    }

    setIsSaving(true);
    postAppRoute(UPDATE_ISSUE_ROUTE_PATH, {
      issueId,
      data: { parentId: null },
    })
      .then(() => {
        setActionError(null);
        return reload();
      })
      .catch((error: unknown) => {
        const message = readErrorText(error);
        setActionError(message);
        void enqueueSnackbar({ message, variant: 'error' });
      })
      .finally(() => setIsSaving(false));
  };

  const renderRow = (
    row: LinkedIssueRow,
    unlink: { onUnlink: () => void; unlinkLabel: string },
  ) => {
    // Unlinking writes the issue, so a reader without the grant gets the row
    // without its control.
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
        onUnlink={data.canWrite ? unlink.onUnlink : undefined}
        unlinkLabel={unlink.unlinkLabel}
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
        ...TASK_THIN_SCROLLBAR_STYLE,
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
          {renderRow(data.parentIssue, {
            onUnlink: detachParent,
            unlinkLabel: t('Remove parent link'),
          })}
        </div>
      )}
      {data.childIssues.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.childIssues.map((child) =>
            renderRow(child, {
              onUnlink: () => unlinkSubtask(child.id),
              unlinkLabel: t('Remove subtask link'),
            }),
          )}
        </div>
      )}
      {data.parentIssue === null && data.childIssues.length === 0 && (
        <TaskEmptyState
          icon={<IconStack2 size={16} />}
          title={t('No subtasks yet')}
          description={
            data.canWrite
              ? t(
                  'Break this issue down — create a subtask or link an existing issue below.',
                )
              : t('This issue has not been broken down into subtasks.')
          }
        />
      )}
      {data.canWrite && (
        <TaskIssueSearch
          value={subtaskDraft}
          onChange={setSubtaskDraft}
          onSelectIssue={linkSubtask}
          onCreateNew={createSubtask}
          isShortcutEnabled={false}
          ariaLabel={t('New subtask title')}
          placeholder={t('Add a subtask…')}
          excludeIds={unlinkableIds}
          maxWidth="100%"
        />
      )}
      {actionError !== null && (
        <TaskStatusLine text={actionError} tone="danger" />
      )}
      {isSaving && (
        <TaskStatusLine text={t('Saving…')} tone="muted" />
      )}
    </section>
  );
};
