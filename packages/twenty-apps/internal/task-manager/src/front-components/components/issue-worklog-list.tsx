import { useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconClock, IconPencil, IconTrash } from 'twenty-ui/icon';

import { formatMinutes, parseMinutes } from '../../utils/format-minutes.util';
import { type MemberRow, type WorklogRow } from '../hooks/use-issue-detail';
import { buildIssueWorklogUrl } from '../utils/build-record-url.util';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskAvatar } from './task-avatar';
import { TaskButton } from './task-button';
import { TaskCopyLinkButton } from './task-copy-link-button';
import { TASK_COMPOSER_BOX_STYLE, TASK_EMPTY_FEED_STYLE } from './task-control-styles';
import { TaskDateTimeInput } from './task-date-time-input';
import {
  FEED_BODY_INDENT,
  FEED_INLINE_INSET,
  TaskFeedItem,
} from './task-feed-item';
import { TaskIconButton } from './task-icon-button';
import { TaskRichTextEditor } from './task-rich-text-editor';
import { TaskSortToggle } from './task-sort-toggle';
import { TaskTextInput } from './task-text-input';
import { TASK_TOKENS } from './task-tokens';

type IssueWorklogListProps = {
  issueId: string;
  baseUrl: string | undefined;
  worklogs: WorklogRow[];
  membersById: Map<string, MemberRow>;
  currentMemberId: string | null;
  highlightedWorklogId: string | null;
  totalMinutes: number | null | undefined;
  originalEstimateMinutes: number | null | undefined;
  isBusy: boolean;
  onCreate: (input: {
    timeSpentMinutes: number;
    description: string;
    startedAt: string;
  }) => void;
  onUpdateDescription: (worklogId: string, description: string) => void;
  onDelete: (worklogId: string) => void;
};

const NOTE_MIN_HEIGHT = 40;
const ROW_INLINE_PADDING = 10;

// datetime-local wants 'YYYY-MM-DDTHH:mm' in local time, which toISOString
// does not give — it is always UTC.
const toDateTimeLocalValue = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const readWorklogTimestamp = (worklog: WorklogRow): number => {
  const parsed = new Date(worklog.startedAt ?? '').getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
};

// Logged time against the original estimate, so the tab says how the issue
// stands rather than just listing entries. Without an estimate it falls back
// to the plain total.
const WorklogSummary = ({
  totalMinutes,
  originalEstimateMinutes,
  isNewestFirst,
  onSortChange,
}: {
  totalMinutes: number | null | undefined;
  originalEstimateMinutes: number | null | undefined;
  isNewestFirst: boolean;
  onSortChange: (isNewestFirst: boolean) => void;
}) => {
  const estimate =
    typeof originalEstimateMinutes === 'number' &&
    originalEstimateMinutes > 0
      ? originalEstimateMinutes
      : null;
  const logged = totalMinutes ?? 0;
  const percent =
    estimate === null || logged <= 0
      ? 0
      : Math.min(100, (logged / estimate) * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: `0 ${ROW_INLINE_PADDING}px`,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
          }}
        >
          {t('Time spent')}: {formatMinutes(totalMinutes)}
          {estimate === null ? '' : ` / ${formatMinutes(estimate)}`}
        </span>
        <TaskSortToggle
          isNewestFirst={isNewestFirst}
          onChange={onSortChange}
        />
      </div>
      {estimate !== null && (
        <div
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            background: TASK_TOKENS.backgroundTertiary,
            borderRadius: TASK_TOKENS.radiusExtraSmall,
            height: 4,
            overflow: 'hidden',
            width: '100%',
          }}
        >
          <div
            style={{
              background:
                logged > estimate ? TASK_TOKENS.red : TASK_TOKENS.accent,
              borderRadius: TASK_TOKENS.radiusExtraSmall,
              height: '100%',
              width: `${percent}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export const IssueWorklogList = ({
  issueId,
  baseUrl,
  worklogs,
  membersById,
  currentMemberId,
  highlightedWorklogId,
  totalMinutes,
  originalEstimateMinutes,
  isBusy,
  onCreate,
  onUpdateDescription,
  onDelete,
}: IssueWorklogListProps) => {
  const [timeSpent, setTimeSpent] = useState('');
  const [description, setDescription] = useState('');
  const [startedAt, setStartedAt] = useState(toDateTimeLocalValue(new Date()));
  const [editingWorklogId, setEditingWorklogId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [isNewestFirst, setIsNewestFirst] = useState(true);

  const currentMemberName = readMemberName(
    membersById,
    currentMemberId,
    t('You'),
  );

  const sortedWorklogs = useMemo(
    () =>
      [...worklogs].sort((left, right) =>
        isNewestFirst
          ? readWorklogTimestamp(right) - readWorklogTimestamp(left)
          : readWorklogTimestamp(left) - readWorklogTimestamp(right),
      ),
    [worklogs, isNewestFirst],
  );

  const parsedMinutes = parseMinutes(timeSpent);

  const submit = () => {
    if (parsedMinutes === null || parsedMinutes <= 0) {
      return;
    }

    onCreate({
      timeSpentMinutes: parsedMinutes,
      description: description.trim(),
      startedAt: new Date(startedAt).toISOString(),
    });
    setTimeSpent('');
    setDescription('');
  };

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: `0 ${FEED_INLINE_INSET}px`,
      }}
    >
      {/* Stacked, not side by side: this composer is a form, and a duration
          field, a date field, a note and a button pushed into the column left
          of an avatar leave each of them too narrow to read. The avatar goes on
          top, as the byline of what is about to be logged. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: `0 ${ROW_INLINE_PADDING}px 8px`,
        }}
      >
        <TaskAvatar
          name={currentMemberName}
          avatarUrl={
            currentMemberId === null
              ? null
              : membersById.get(currentMemberId)?.avatarUrl
          }
          size={24}
        />
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            gap: 8,
            minWidth: 0,
            paddingLeft: FEED_BODY_INDENT,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <TaskTextInput
              ariaLabel={t('Time spent')}
              value={timeSpent}
              onChange={setTimeSpent}
              placeholder={t('e.g. 90 or 1h30m')}
              width={150}
              prefixIcon={
                <IconClock size={14} color={TASK_TOKENS.textTertiary} />
              }
            />
            <TaskDateTimeInput
              ariaLabel={t('Started at')}
              value={startedAt}
              onChange={setStartedAt}
            />
          </div>
          <div style={{ ...TASK_COMPOSER_BOX_STYLE, display: 'flex' }}>
            <TaskRichTextEditor
              value={description}
              onChange={setDescription}
              placeholder={t('Write what you worked on…')}
              minHeight={NOTE_MIN_HEIGHT}
              issueId={issueId}
            />
          </div>
          <div style={{ display: 'flex' }}>
            <TaskButton
              variant="primary"
              isDisabled={isBusy || parsedMinutes === null || parsedMinutes <= 0}
              onClick={submit}
            >
              {t('Log time')}
            </TaskButton>
          </div>
        </div>
      </div>

      {worklogs.length === 0 ? (
        <div
          style={{ ...TASK_EMPTY_FEED_STYLE, margin: `0 ${ROW_INLINE_PADDING}px` }}
        >
          {t('No time logged yet.')}
        </div>
      ) : (
        <WorklogSummary
          totalMinutes={totalMinutes}
          originalEstimateMinutes={originalEstimateMinutes}
          isNewestFirst={isNewestFirst}
          onSortChange={setIsNewestFirst}
        />
      )}

      {sortedWorklogs.map((worklog) => {
        const isOwn =
          currentMemberId !== null && worklog.memberId === currentMemberId;
        const isEditing = editingWorklogId === worklog.id;
        const member =
          typeof worklog.memberId === 'string'
            ? membersById.get(worklog.memberId)
            : undefined;
        const memberName = readMemberName(
          membersById,
          worklog.memberId,
          t('Unknown'),
        );

        return (
          <TaskFeedItem
            key={worklog.id}
            anchorId={`worklog-${worklog.id}`}
            isHighlighted={worklog.id === highlightedWorklogId}
            authorName={memberName}
            authorEmail={member?.userEmail}
            avatarUrl={member?.avatarUrl}
            timestamp={worklog.startedAt}
            meta={
              <span
                style={{
                  color: TASK_TOKENS.textSecondary,
                  flexShrink: 0,
                  fontSize: 12,
                }}
              >
                {t('logged')} {formatMinutes(worklog.timeSpentMinutes)}
              </span>
            }
            actions={
              isEditing ? undefined : (
                <>
                  <TaskCopyLinkButton
                    url={buildIssueWorklogUrl({
                      baseUrl,
                      issueId,
                      worklogId: worklog.id,
                    })}
                    label={t('Copy link to worklog')}
                  />
                  {isOwn && (
                    <>
                      <TaskIconButton
                        label={t('Edit')}
                        isDisabled={isBusy}
                        onClick={() => {
                          setEditingWorklogId(worklog.id);
                          setEditDraft(worklog.description ?? '');
                        }}
                      >
                        <IconPencil size={14} />
                      </TaskIconButton>
                      <TaskIconButton
                        label={t('Delete')}
                        isDanger
                        isDisabled={isBusy}
                        onClick={() => onDelete(worklog.id)}
                      >
                        <IconTrash size={14} />
                      </TaskIconButton>
                    </>
                  )}
                </>
              )
            }
          >
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ ...TASK_COMPOSER_BOX_STYLE, display: 'flex' }}>
                  <TaskRichTextEditor
                    value={editDraft}
                    onChange={setEditDraft}
                    minHeight={NOTE_MIN_HEIGHT}
                    issueId={issueId}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <TaskButton
                    variant="primary"
                    size="small"
                    isDisabled={isBusy}
                    onClick={() => {
                      onUpdateDescription(worklog.id, editDraft.trim());
                      setEditingWorklogId(null);
                    }}
                  >
                    {t('Save')}
                  </TaskButton>
                  <TaskButton
                    size="small"
                    onClick={() => setEditingWorklogId(null)}
                  >
                    {t('Cancel')}
                  </TaskButton>
                </div>
              </div>
            ) : (
              <TaskRichTextEditor
                value={worklog.description ?? ''}
                isReadOnly
              />
            )}
          </TaskFeedItem>
        );
      })}
    </section>
  );
};
