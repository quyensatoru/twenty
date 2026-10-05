import { t } from 'twenty-sdk/front-component';

import { type IssueHistoryRow, type MemberRow } from '../hooks/use-issue-detail';
import { readMemberName } from '../utils/read-member-name.util';
import { FEED_INLINE_INSET, TaskFeedItem } from './task-feed-item';
import { TASK_EMPTY_FEED_STYLE } from './task-control-styles';
import { TASK_TOKENS } from './task-tokens';

// The same rhythm the other two tabs keep: a row already carries its own block
// padding, so the gap between rows is the small one. History ran at 16 and read
// as a different list from the Comments beside it.
const FEED_GAP = 4;
// Comments and worklogs open with a composer, which is what holds their first
// row off the tab strip. History has none, so it pays for that space itself.
const FEED_TOP_PADDING = 8;

// System events of the issue, oldest first: creation and every tracked field
// change the triggers recorded. Read-only on purpose — history is written by
// database triggers, never by hand, so there is nothing to create, edit or
// delete from this list.
export const IssueHistoryList = ({
  histories,
  membersById,
  statusNameById,
}: {
  histories: IssueHistoryRow[];
  membersById: Map<string, MemberRow>;
  statusNameById: Map<string, string>;
}) => {
  if (histories.length === 0) {
    return (
      <div
        style={{
          ...TASK_EMPTY_FEED_STYLE,
          margin: `${FEED_TOP_PADDING}px ${FEED_INLINE_INSET}px 0`,
        }}
      >
        {t('No history yet.')}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: FEED_GAP,
        padding: `${FEED_TOP_PADDING}px ${FEED_INLINE_INSET}px 0`,
      }}
    >
      {histories.map((history) => {
        const author =
          typeof history.authorId === 'string'
            ? membersById.get(history.authorId)
            : undefined;
        // A change made through one of the app's own routes is written by the
        // application token, so the database event carries no workspace member
        // and the entry has no author. That is not an unknown person, it is no
        // person: the board drag and the app panels all land here.
        const authorName = readMemberName(
          membersById,
          history.authorId,
          t('System'),
        );

        return (
          <TaskFeedItem
            key={history.id}
            authorName={authorName}
            authorEmail={author?.userEmail}
            avatarUrl={author?.avatarUrl}
            timestamp={history.createdAt}
          >
            <HistoryActionLine
              history={history}
              statusNameById={statusNameById}
            />
          </TaskFeedItem>
        );
      })}
    </div>
  );
};

const HistoryActionLine = ({
  history,
  statusNameById,
}: {
  history: IssueHistoryRow;
  statusNameById: Map<string, string>;
}) => {
  const lineStyle = {
    color: TASK_TOKENS.textSecondary,
    fontFamily: TASK_TOKENS.fontFamily,
    fontSize: 12,
  } as const;

  if (history.action === 'created') {
    return <span style={lineStyle}>{t('Created this issue')}</span>;
  }

  if (history.action === 'status-changed') {
    return (
      <span style={lineStyle}>
        {t('Status changed')}{' '}
        <StatusName
          statusId={history.fromStatusId}
          statusNameById={statusNameById}
        />{' '}
        →{' '}
        <StatusName
          statusId={history.toStatusId}
          statusNameById={statusNameById}
        />
      </span>
    );
  }

  return <span style={lineStyle}>{history.action ?? t('Changed')}</span>;
};

const StatusName = ({
  statusId,
  statusNameById,
}: {
  statusId?: string | null;
  statusNameById: Map<string, string>;
}) => (
  <strong style={{ fontWeight: 600 }}>
    {typeof statusId === 'string'
      ? (statusNameById.get(statusId) ?? t('Removed'))
      : '—'}
  </strong>
);
