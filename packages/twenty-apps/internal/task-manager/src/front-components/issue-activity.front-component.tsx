import { useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { t, useRecordId } from 'twenty-sdk/front-component';

import {
  CREATE_ISSUE_COMMENT_ROUTE_PATH,
  CREATE_WORKLOG_ROUTE_PATH,
  DELETE_ISSUE_COMMENT_ROUTE_PATH,
  DELETE_WORKLOG_ROUTE_PATH,
  UPDATE_ISSUE_COMMENT_ROUTE_PATH,
} from '../constants/route-paths';
import { ISSUE_ACTIVITY_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { buildRichTextValue } from '../utils/read-rich-text-plain-value.util';
import { IssueCommentList } from './components/issue-comment-list';
import { IssueWorklogList } from './components/issue-worklog-list';
import { TaskMessage } from './components/task-message';
import { TaskTabs } from './components/task-tabs';
import { TaskTag } from './components/task-tag';
import { TASK_TOKENS } from './components/task-tokens';
import { type MemberRow, useIssueDetail } from './hooks/use-issue-detail';
import { postAppRoute } from './utils/post-app-route.util';
import { readErrorText } from './utils/read-error-text.util';

// Comments and worklogs of the issue this record page is showing. Deliberately
// NOT a RECORD_TABLE widget: a host widget reads and writes with the viewer's
// own token, so it goes blank once the Member role loses direct access to these
// objects — the step that makes app-scope real. Going through the app's routes
// also keeps the worklog time-tracking recomputation and the comment author
// rule applied, neither of which a direct record write would trigger.
const IssueActivity = () => {
  const issueId = useRecordId();
  const { data, isLoading, loadError, reload } = useIssueDetail(issueId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  // The fork put comments and worklogs behind two tabs rather than stacking
  // them; keeping that split is what makes the panel read the same.
  const [activityTab, setActivityTab] = useState<'comments' | 'worklogs'>(
    'comments',
  );

  const membersById = useMemo(
    () => new Map<string, MemberRow>(data.members.map((m) => [m.id, m])),
    [data.members],
  );

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

  if (isLoading) {
    return <TaskMessage text={t('Loading…')} />;
  }

  if (loadError !== null) {
    return <TaskMessage text={loadError} tone="danger" />;
  }

  if (data.issue === null) {
    return <TaskMessage text={t('This issue is not available to you.')} />;
  }

  return (
    <main
      style={{
        background: TASK_TOKENS.background,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 20,
        height: '100%',
        overflowY: 'auto',
        padding: 16,
        width: '100%',
      }}
    >
      {actionError !== null && (
        <span style={{ color: TASK_TOKENS.textDanger, fontSize: 12 }}>
          {actionError}
        </span>
      )}

      {data.merchants.length > 0 && (
        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              fontSize: 12,
              marginRight: 4,
            }}
          >
            {t('Merchants')}
          </span>
          {data.merchants.map((merchant) => (
            <TaskTag key={merchant.id} color="blue">
              {merchant.name ?? merchant.id}
            </TaskTag>
          ))}
        </section>
      )}

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
        ]}
      />

      {activityTab === 'comments' ? (
      <IssueCommentList
        comments={data.issueComments}
        membersById={membersById}
        currentMemberId={data.currentWorkspaceMemberId}
        isBusy={isBusy}
        onCreate={(markdown) =>
          void run(() =>
            postAppRoute(CREATE_ISSUE_COMMENT_ROUTE_PATH, {
              issueId,
              bodyV2: buildRichTextValue(markdown),
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
      ) : (
      <IssueWorklogList
        worklogs={data.worklogs}
        membersById={membersById}
        currentMemberId={data.currentWorkspaceMemberId}
        totalMinutes={data.issue.timeSpentMinutes}
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
        onDelete={(worklogId) =>
          void run(() =>
            postAppRoute(DELETE_WORKLOG_ROUTE_PATH, { worklogId }),
          )
        }
      />
      )}
    </main>
  );
};

export default defineFrontComponent({
  universalIdentifier: ISSUE_ACTIVITY_FRONT_COMPONENT_UID,
  name: 'issue-activity',
  description:
    "Comments and worklogs of an issue, written through the app's scoped routes.",
  component: IssueActivity,
});
