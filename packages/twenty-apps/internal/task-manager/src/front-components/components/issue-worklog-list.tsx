import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconClock, IconLink, IconPencil, IconTrash } from 'twenty-ui/icon';

import { formatMinutes, parseMinutes } from '../../utils/format-minutes.util';
import { type MemberRow, type WorklogRow } from '../hooks/use-issue-detail';
import { useIsMobile } from '../hooks/use-is-mobile';
import { buildIssueWorklogUrl } from '../utils/build-record-url.util';
import { isGroupedFeedItem } from '../utils/is-grouped-feed-item.util';
import { readMemberName } from '../utils/read-member-name.util';
import { TaskButton } from './task-button';
import { copyLinkToClipboard } from './task-copy-link-button';
import { TASK_COMPOSER_BOX_STYLE } from './task-control-styles';
import { TaskDateTimeInput } from './task-date-time-input';
import {
  FEED_BODY_INDENT,
  FEED_GAP,
  FEED_INLINE_INSET,
  FEED_TEXT_INSET,
  TaskFeedComposerRow,
  TaskFeedItem,
} from './task-feed-item';
import { TaskFeedMoreMenu } from './task-feed-more-menu';
import { TaskIconButton } from './task-icon-button';
import { TaskRichTextEditor } from './task-rich-text-editor';
import { TaskSortToggle } from './task-sort-toggle';
import { TaskTextInput } from './task-text-input';
import { TASK_TOKENS } from './task-tokens';

type IssueWorklogListProps = {
  issueId: string;
  baseUrl: string | undefined;
  boardPath?: string | null;
  worklogs: WorklogRow[];
  membersById: Map<string, MemberRow>;
  currentMemberId: string | null;
  highlightedWorklogId: string | null;
  // The caller's grants on the issue's app: writing covers logging and
  // editing; deleting needs its own grant.
  canWrite: boolean;
  canSoftDelete: boolean;
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
  // Set by a caller that shows the sort toggle on its tab row and the totals
  // elsewhere; the list then drops its own summary line.
  sortIsNewestFirst?: boolean;
};

const NOTE_MIN_HEIGHT = 40;
const ROW_INLINE_PADDING = 10;
const PROGRESS_WIDTH = 120;

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
  sortToggle,
}: {
  totalMinutes: number | null | undefined;
  originalEstimateMinutes: number | null | undefined;
  sortToggle?: ReactNode;
}) => {
  const estimate =
    typeof originalEstimateMinutes === 'number' && originalEstimateMinutes > 0
      ? originalEstimateMinutes
      : null;
  const logged = totalMinutes ?? 0;
  const percent =
    estimate === null || logged <= 0
      ? 0
      : Math.min(100, (logged / estimate) * 100);
  const loggedLabel = (
    <strong style={{ color: TASK_TOKENS.textPrimary, fontWeight: 600 }}>
      {formatMinutes(logged)}
    </strong>
  );

  return (
    <div
      style={{
        alignItems: 'center',
        color: TASK_TOKENS.textSecondary,
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12.5,
        gap: 12,
        minHeight: 24,
        padding: `0 ${ROW_INLINE_PADDING}px 0 ${FEED_BODY_INDENT + FEED_TEXT_INSET}px`,
      }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {estimate === null ? (
          <>
            {loggedLabel} {t('logged')}
          </>
        ) : (
          <>
            {loggedLabel}{' '}
            {t('logged of {estimate} estimate', {
              estimate: formatMinutes(estimate),
            })}
          </>
        )}
      </span>
      {estimate !== null && (
        <div
          role="progressbar"
          aria-label={t('Time logged against the estimate')}
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            background: TASK_TOKENS.backgroundTertiary,
            borderRadius: 2,
            flexShrink: 0,
            height: 4,
            overflow: 'hidden',
            width: PROGRESS_WIDTH,
          }}
        >
          <div
            style={{
              background:
                logged > estimate ? TASK_TOKENS.red : TASK_TOKENS.accent,
              height: '100%',
              width: `${percent}%`,
            }}
          />
        </div>
      )}
      <span style={{ flex: 1 }} />
      {sortToggle}
    </div>
  );
};

export const IssueWorklogList = ({
  issueId,
  baseUrl,
  boardPath,
  worklogs,
  membersById,
  currentMemberId,
  highlightedWorklogId,
  canWrite,
  canSoftDelete,
  totalMinutes,
  originalEstimateMinutes,
  isBusy,
  onCreate,
  onUpdateDescription,
  onDelete,
  sortIsNewestFirst,
}: IssueWorklogListProps) => {
  const [timeSpent, setTimeSpent] = useState('');
  const [description, setDescription] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [startedAt, setStartedAt] = useState(toDateTimeLocalValue(new Date()));
  const [editingWorklogId, setEditingWorklogId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [openMenuWorklogId, setOpenMenuWorklogId] = useState<string | null>(
    null,
  );
  const isMobile = useIsMobile();
  const [ownIsNewestFirst, setIsNewestFirst] = useState(true);
  const isNewestFirst = sortIsNewestFirst ?? ownIsNewestFirst;

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
    // The host editor and the stable text fields keep what they last showed,
    // so a fresh form is a remount.
    setFormKey((key) => key + 1);
  };

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: FEED_GAP,
        padding: `0 ${FEED_INLINE_INSET}px`,
      }}
    >
      {canWrite && (
        <TaskFeedComposerRow
          name={readMemberName(membersById, currentMemberId, '')}
          avatarUrl={
            currentMemberId === null
              ? undefined
              : membersById.get(currentMemberId)?.avatarUrl
          }
        >
          <div
            key={formKey}
            style={{
              ...TASK_COMPOSER_BOX_STYLE,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                // The host editor's own frame would be a second border here.
                ...({
                  '--t-border-color-medium': 'transparent',
                } as CSSProperties),
                display: 'flex',
              }}
            >
              <TaskRichTextEditor
                value={description}
                onChange={setDescription}
                placeholder={t('What did you work on?')}
                minHeight={NOTE_MIN_HEIGHT}
                issueId={issueId}
              />
            </div>
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: '2px 8px 8px 8px',
              }}
            >
              <TaskTextInput
                ariaLabel={t('Time spent')}
                value={timeSpent}
                onChange={setTimeSpent}
                onEnter={submit}
                placeholder={t('1h30m')}
                width={120}
                height={28}
                prefixIcon={
                  <IconClock size={14} color={TASK_TOKENS.textTertiary} />
                }
              />
              <TaskDateTimeInput
                ariaLabel={t('Started at')}
                value={startedAt}
                onChange={setStartedAt}
              />
              <span style={{ flex: 1 }} />
              <TaskButton
                variant="primary"
                size="compact"
                isDisabled={
                  isBusy || parsedMinutes === null || parsedMinutes <= 0
                }
                onClick={submit}
              >
                {t('Log time')}
              </TaskButton>
            </div>
          </div>
        </TaskFeedComposerRow>
      )}

      {worklogs.length === 0 ? (
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            paddingLeft: FEED_BODY_INDENT + FEED_TEXT_INSET,
          }}
        >
          {t('No time logged yet.')}
        </span>
      ) : (
        <WorklogSummary
          totalMinutes={totalMinutes}
          originalEstimateMinutes={originalEstimateMinutes}
          sortToggle={
            sortIsNewestFirst === undefined ? (
              <TaskSortToggle
                isNewestFirst={isNewestFirst}
                onChange={setIsNewestFirst}
              />
            ) : undefined
          }
        />
      )}

      {sortedWorklogs.map((worklog, index) => {
        const isOwn =
          currentMemberId !== null && worklog.memberId === currentMemberId;
        const canEdit = isOwn && canWrite;
        const canDelete = isOwn && canSoftDelete;
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
        const previous = sortedWorklogs[index - 1];
        const isGrouped = isGroupedFeedItem(
          previous === undefined
            ? undefined
            : { authorId: previous.memberId, timestamp: previous.startedAt },
          { authorId: worklog.memberId, timestamp: worklog.startedAt },
        );
        const description = worklog.description ?? '';

        return (
          <div
            key={worklog.id}
            style={{ marginTop: isGrouped ? -FEED_GAP : 0, minWidth: 0 }}
          >
            <TaskFeedItem
              anchorId={`worklog-${worklog.id}`}
              isHighlighted={worklog.id === highlightedWorklogId}
              authorName={memberName}
              authorEmail={member?.userEmail}
              avatarUrl={member?.avatarUrl}
              timestamp={worklog.startedAt}
              isGrouped={isGrouped}
              meta={
                <span
                  title={t('Time logged')}
                  style={{
                    alignItems: 'center',
                    background: TASK_TOKENS.accentSoft,
                    borderRadius: 10,
                    color: TASK_TOKENS.accent,
                    display: 'inline-flex',
                    flexShrink: 0,
                    fontSize: 11.5,
                    fontWeight: 500,
                    gap: 4,
                    height: 20,
                    padding: '0 6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <IconClock size={11} />
                  {formatMinutes(worklog.timeSpentMinutes)}
                </span>
              }
              shouldShowHoverActions={
                isMobile || openMenuWorklogId === worklog.id
              }
              hoverActions={
                isEditing ? undefined : (
                  <>
                    {canEdit && (
                      <TaskIconButton
                        label={t('Edit')}
                        isDisabled={isBusy}
                        onClick={() => {
                          setEditingWorklogId(worklog.id);
                          setEditDraft(description);
                        }}
                      >
                        <IconPencil size={14} />
                      </TaskIconButton>
                    )}
                    {boardPath !== null && (
                      <TaskIconButton
                        label={t('Copy link')}
                        onClick={() =>
                          copyLinkToClipboard(
                            buildIssueWorklogUrl({
                              baseUrl,
                              issueId,
                              worklogId: worklog.id,
                              boardPath,
                            }),
                          )
                        }
                      >
                        <IconLink size={14} />
                      </TaskIconButton>
                    )}
                    <TaskFeedMoreMenu
                      onOpenChange={(isOpen) =>
                        setOpenMenuWorklogId(isOpen ? worklog.id : null)
                      }
                      items={[
                        ...(canDelete
                          ? [
                              {
                                key: 'delete',
                                label: t('Delete worklog'),
                                icon: <IconTrash size={14} />,
                                isDanger: true,
                                confirmLabel: t('Confirm delete?'),
                                onSelect: () => onDelete(worklog.id),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </>
                )
              }
            >
              {isEditing ? (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
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
              ) : description.trim() === '' ? (
                <span
                  style={{
                    color: TASK_TOKENS.textTertiary,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {t('No description')}
                </span>
              ) : (
                <TaskRichTextEditor value={description} isReadOnly />
              )}
            </TaskFeedItem>
          </div>
        );
      })}
    </section>
  );
};
