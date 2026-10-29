import { t } from 'twenty-sdk/front-component';
import { IconHistory } from 'twenty-ui/icon';

import {
  type IssueHistoryRow,
  type MemberRow,
} from '../hooks/use-issue-detail';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskEmptyState } from './task-empty-state';
import { formatDateTimeLabel } from '../utils/format-date-time-label.util';
import { formatRelativeTimeLabel } from '../utils/format-relative-time-label.util';
import { TaskAvatar } from './task-avatar';
import { FEED_INLINE_INSET } from './task-feed-item';
import { TASK_TOKENS } from './task-tokens';

const FEED_TOP_PADDING = 0;
const AVATAR_SIZE = 20;
// Centres the timeline rule on the avatar column of the comment bubbles, so
// switching tabs does not shift the left edge of the feed.
const AVATAR_COLUMN = 24;

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
      <TaskEmptyState
        icon={<IconHistory size={16} />}
        title={t('No history yet')}
        description={t(
          'Status changes, edits and moves on this issue will show up here.',
        )}
        style={{ margin: `${FEED_TOP_PADDING}px ${FEED_INLINE_INSET}px 0` }}
      />
    );
  }

  return (
    <ol
      style={{
        display: 'flex',
        flexDirection: 'column',
        listStyle: 'none',
        margin: 0,
        padding: `${FEED_TOP_PADDING}px ${FEED_INLINE_INSET}px 0`,
      }}
    >
      {histories.map((history, index) => {
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
        const isLast = index === histories.length - 1;

        return (
          <li
            key={history.id}
            style={{
              alignItems: 'stretch',
              display: 'flex',
              fontFamily: TASK_TOKENS.fontFamily,
              gap: 10,
              minHeight: 36,
            }}
          >
            <span
              style={{
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                width: AVATAR_COLUMN,
              }}
            >
              <span style={{ display: 'inline-flex', paddingTop: 6 }}>
                <TaskAvatar
                  name={authorName}
                  avatarUrl={author?.avatarUrl}
                  size={AVATAR_SIZE}
                  shouldShowTitle={false}
                />
              </span>
              {!isLast && (
                <span
                  style={{
                    background: TASK_TOKENS.borderLight,
                    flex: 1,
                    marginTop: 4,
                    width: 1,
                  }}
                />
              )}
            </span>
            <span
              style={{
                color: TASK_TOKENS.textSecondary,
                fontSize: 13,
                lineHeight: '20px',
                minWidth: 0,
                padding: '6px 0 10px 0',
              }}
            >
              <strong
                style={{ color: TASK_TOKENS.textPrimary, fontWeight: 600 }}
              >
                {authorName}
              </strong>{' '}
              <HistoryActionLine
                history={history}
                statusNameById={statusNameById}
              />
              <span
                title={formatDateTimeLabel(history.createdAt)}
                style={{ color: TASK_TOKENS.textTertiary, fontSize: 12 }}
              >
                {' · '}
                {formatRelativeTimeLabel(history.createdAt)}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};

const HistoryActionLine = ({
  history,
  statusNameById,
}: {
  history: IssueHistoryRow;
  statusNameById: Map<string, string>;
}) => {
  const lineStyle = { color: TASK_TOKENS.textSecondary } as const;

  if (history.action === 'created') {
    return <span style={lineStyle}>{t('created this issue')}</span>;
  }

  if (history.action === 'status-changed') {
    return (
      <span style={lineStyle}>
        {t('changed status from')}{' '}
        <StatusName
          statusId={history.fromStatusId}
          statusNameById={statusNameById}
        />{' '}
        {t('to')}{' '}
        <StatusName
          statusId={history.toStatusId}
          statusNameById={statusNameById}
        />
      </span>
    );
  }

  const criterionLabel = readCriterionActionLabel(history.action);

  if (criterionLabel !== null) {
    return (
      <span style={lineStyle}>
        {criterionLabel}{' '}
        <strong style={{ color: TASK_TOKENS.textPrimary, fontWeight: 500 }}>
          {history.detail ?? ''}
        </strong>
      </span>
    );
  }

  if (history.action === 'returned-to-backlog') {
    return (
      <span style={lineStyle}>{t('returned it to the Product Backlog')}</span>
    );
  }

  if (history.action === 'moved-from-backlog-column') {
    return (
      <span style={lineStyle}>
        {t('moved it from the Backlog column to the Product Backlog (V1.4)')}
      </span>
    );
  }

  return <span style={lineStyle}>{history.action ?? t('Changed')}</span>;
};

const readCriterionActionLabel = (action?: string | null) => {
  switch (action) {
    case 'ac-added':
      return t('added acceptance criterion');
    case 'ac-removed':
      return t('removed acceptance criterion');
    case 'ac-checked':
      return t('met acceptance criterion');
    case 'ac-unchecked':
      return t('unmet acceptance criterion');
    default:
      return null;
  }
};

const StatusName = ({
  statusId,
  statusNameById,
}: {
  statusId?: string | null;
  statusNameById: Map<string, string>;
}) => (
  <strong style={{ color: TASK_TOKENS.textPrimary, fontWeight: 500 }}>
    {typeof statusId === 'string'
      ? (statusNameById.get(statusId) ?? t('Removed'))
      : '—'}
  </strong>
);
