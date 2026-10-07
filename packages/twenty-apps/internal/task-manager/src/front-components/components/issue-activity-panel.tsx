import { type ReactNode, useMemo, useState } from 'react';
import {
  t,
  useFrontComponentExecutionContext,
  useRecordId,
} from 'twenty-sdk/front-component';

import {
  CREATE_ISSUE_COMMENT_ROUTE_PATH,
  CREATE_WORKLOG_ROUTE_PATH,
  DELETE_ISSUE_COMMENT_ROUTE_PATH,
  DELETE_WORKLOG_ROUTE_PATH,
  UPDATE_ISSUE_COMMENT_ROUTE_PATH,
  UPDATE_WORKLOG_ROUTE_PATH,
} from '../../constants/route-paths';
import { buildRichTextValue } from '../../utils/read-rich-text-plain-value.util';
import { parseActivityAnchor } from '../utils/parse-activity-anchor.util';
import { readRecordPageBaseUrl } from '../utils/read-record-page-base-url.util';
import { IssueCommentList } from './issue-comment-list';
import { IssueHistoryList } from './issue-history-list';
import { IssueWorklogList } from './issue-worklog-list';
import { TaskMessage } from './task-message';
import {
  TaskSkeletonAvatarRow,
  TaskSkeletonBar,
} from './task-skeleton';
import { TaskStatusLine } from './task-status-line';
import { TaskTabs } from './task-tabs';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';
import { type MemberRow, useIssueDetail } from '../hooks/use-issue-detail';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

// The panel scrolls inside a fixed grid row, so the scroll container is this
// element and everything pinned inside it pins against this box. The top
// padding lives on the sticky header, so nothing shows above the header as
// the list slides under it.
//
// No side padding of its own: the widget card already insets its content by
// --widget-card-padding-inline, and a second inset here is what put this
// panel's left edge 16px inside the description panel's above it.
const ActivityFrame = ({ children }: { children: ReactNode }) => (
  <main
    style={{
      background: TASK_TOKENS.background,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: TASK_TOKENS.fontFamily,
      height: '100%',
      minHeight: 0,
      overflowY: 'auto',
      ...TASK_THIN_SCROLLBAR_STYLE,
      paddingBottom: 16,
      width: '100%',
    }}
  >
    {children}
  </main>
);

// Comments and worklogs of the issue this record page is showing. Deliberately
// NOT a RECORD_TABLE widget: a host widget reads and writes with the viewer's
// own token, so it goes blank once the Member role loses direct access to these
// objects — the step that makes app-scope real. Going through the app's routes
// also keeps the worklog time-tracking recomputation and the comment author
// rule applied, neither of which a direct record write would trigger.
//
// Shared between its own widget and the record page's unified left column, so
// this lives outside the front-component file: the app build strips named
// exports out of `*.front-component.tsx`.
export const IssueActivity = () => {
  const issueId = useRecordId();
  // Pinned to the published SDK, whose context type predates this field. The
  // host sends it (useFrontComponentExecutionContext in twenty-front); drop the
  // cast once the app moves to an SDK that declares `locationHash`.
  const locationHash = useFrontComponentExecutionContext(
    (context) => (context as { locationHash?: string }).locationHash ?? '',
  );
  const anchor = parseActivityAnchor(locationHash);
  const { data, isLoading, loadError, reload } = useIssueDetail(issueId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  // The fork put comments and worklogs behind two tabs rather than stacking
  // them; keeping that split is what makes the panel read the same. History
  // joins them as the third tab: the triggers write it, nobody edits it.
  //
  // A deep link decides the opening tab, so a link to a worklog does not land
  // on the comments it is not about. It is the INITIAL value only: the reader
  // keeps whatever they switch to afterwards, and the hash does not change
  // under them while they read.
  const [activityTab, setActivityTab] = useState<
    'comments' | 'worklogs' | 'history'
  >(anchor?.kind === 'worklog' ? 'worklogs' : 'comments');

  const membersById = useMemo(
    () => new Map<string, MemberRow>(data.members.map((m) => [m.id, m])),
    [data.members],
  );

  const statusNameById = useMemo(() => {
    const names = new Map<string, string>();

    for (const status of data.issueStatuses) {
      if (typeof status.name === 'string') {
        names.set(status.id, status.name);
      }
    }

    return names;
  }, [data.issueStatuses]);

  const run = async (action: () => Promise<unknown>) => {
    setIsBusy(true);

    try {
      await action();
      setActionError(null);
      await reload();
    } catch (error) {
      setActionError(readErrorText(error));
    } finally {
      setIsBusy(false);
    }
  };

  if (issueId === null) {
    return <TaskMessage text={t('No issue selected.')} />;
  }

  if (isLoading && data.issue === null) {
    return (
      <ActivityFrame>
        <div
          style={{
            display: 'flex',
            gap: 4,
            paddingBottom: 12,
            paddingTop: 4,
          }}
        >
          <TaskSkeletonBar
            width={92}
            height={28}
            radius={TASK_TOKENS.radiusSmall}
          />
          <TaskSkeletonBar
            width={92}
            height={28}
            radius={TASK_TOKENS.radiusSmall}
          />
          <TaskSkeletonBar
            width={76}
            height={28}
            radius={TASK_TOKENS.radiusSmall}
          />
        </div>
        <div
          style={{
            border: `1px solid ${TASK_TOKENS.border}`,
            borderRadius: TASK_TOKENS.radius,
            height: 72,
            marginBottom: 4,
          }}
        />
        <TaskSkeletonAvatarRow lines={[85, 60]} />
      </ActivityFrame>
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
    <ActivityFrame>
      {/* Pinned, so the tabs and whatever went wrong stay reachable however
          far down a long thread the reader is, and so a message appearing
          never pushes the list they are reading. */}
      <div
        style={{
          background: TASK_TOKENS.background,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingBottom: 12,
          paddingTop: 4,
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <TaskTabs
          value={activityTab}
          onChange={setActivityTab}
          tabs={[
            {
              value: 'comments',
              label: t('Comments'),
              count: data.issueComments.length,
            },
            {
              value: 'worklogs',
              label: t('Worklogs'),
              count: data.worklogs.length,
            },
            {
              value: 'history',
              label: t('History'),
            },
          ]}
        />

        <TaskStatusLine text={actionError ?? loadError} tone="danger" />
      </div>

      {activityTab === 'comments' ? (
      <IssueCommentList
        issueId={issueId}
        baseUrl={readRecordPageBaseUrl()}
        comments={data.issueComments}
        membersById={membersById}
        currentMemberId={data.currentWorkspaceMemberId}
        highlightedCommentId={anchor?.kind === 'comment' ? anchor.id : null}
        canWrite={data.canWrite}
        canSoftDelete={data.canSoftDelete}
        isBusy={isBusy}
        onCreate={(input) =>
          void run(() =>
            postAppRoute(CREATE_ISSUE_COMMENT_ROUTE_PATH, {
              issueId,
              bodyV2: buildRichTextValue(input.markdown),
              ...(input.parentCommentId === undefined
                ? {}
                : { parentCommentId: input.parentCommentId }),
            }),
          )
        }
        onUpdate={(commentId, markdown) =>
          void run(() =>
            postAppRoute(UPDATE_ISSUE_COMMENT_ROUTE_PATH, {
              issueCommentId: commentId,
              data: { bodyV2: buildRichTextValue(markdown) },
            }),
          )
        }
        onDelete={(commentId) =>
          void run(() =>
            postAppRoute(DELETE_ISSUE_COMMENT_ROUTE_PATH, {
              issueCommentId: commentId,
            }),
          )
        }
      />
      ) : activityTab === 'worklogs' ? (
      <IssueWorklogList
        issueId={issueId}
        baseUrl={readRecordPageBaseUrl()}
        worklogs={data.worklogs}
        membersById={membersById}
        currentMemberId={data.currentWorkspaceMemberId}
        highlightedWorklogId={anchor?.kind === 'worklog' ? anchor.id : null}
        canWrite={data.canWrite}
        canSoftDelete={data.canSoftDelete}
        totalMinutes={data.issue.timeSpentMinutes}
        originalEstimateMinutes={data.issue.originalEstimateMinutes}
        isBusy={isBusy}
        onCreate={(input) =>
          void run(() =>
            postAppRoute(CREATE_WORKLOG_ROUTE_PATH, {
              issueId,
              data: {
                timeSpentMinutes: input.timeSpentMinutes,
                description: input.description,
                startedAt: input.startedAt,
              },
            }),
          )
        }
        onUpdateDescription={(worklogId, description) =>
          void run(() =>
            postAppRoute(UPDATE_WORKLOG_ROUTE_PATH, {
              worklogId,
              data: { description },
            }),
          )
        }
        onDelete={(worklogId) =>
          void run(() =>
            postAppRoute(DELETE_WORKLOG_ROUTE_PATH, { worklogId }),
          )
        }
      />
      ) : (
      <IssueHistoryList
        histories={data.issueHistories}
        membersById={membersById}
        statusNameById={statusNameById}
      />
      )}
    </ActivityFrame>
  );
};
