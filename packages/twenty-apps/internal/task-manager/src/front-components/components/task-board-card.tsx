import { isNonEmptyString } from '@sniptt/guards';
import { useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconGitBranch,
  IconArrowMerge,
  IconCircleX,
  IconCalendarEvent,
  IconCalendarRepeat,
  IconCheck,
  IconDotsVertical,
  IconPin,
  IconPinned,
  IconPinnedOff,
  IconTrash,
  IconUser,
} from 'twenty-ui/icon';

import { ISSUE_LABEL_OPTIONS } from '../../constants/issue-label-options';
import { ISSUE_TYPE_OPTIONS } from '../../constants/issue-type-options';
import { type IssueCardFieldKey } from '../../constants/issue-view-fields';
import { type BoardIssue } from '../../types/task-board';
import { readIsOverdue, readShortDate } from '../utils/read-due-date.util';
import { TaskAvatar } from './task-avatar';
import { TaskChip, TaskColorDot } from './task-chip';
import { TaskPriorityGlyph } from './task-priority-glyph';
import {
  readTagColor,
  TASK_CIRCLE_STYLE,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from './task-tokens';

type TaskBoardCardProps = {
  issue: BoardIssue;
  statusOptions: readonly {
    value: string;
    label: string;
    color?: string | null;
  }[];
  assigneeName: string | null;
  assigneeAvatarUrl?: string | null;
  epicName: string | null;
  epicColor: string | null;
  sprintName: string | null;
  reporterName: string | null;
  reporterAvatarUrl?: string | null;
  // What the project chose to keep off its cards; title and key always show.
  hiddenFields: readonly IssueCardFieldKey[];
  isDone: boolean;
  isSelected: boolean;
  isDragging: boolean;
  // Moving and deleting change the issue for everyone, so they follow the
  // caller's grants on the project; a reader without them can only open it.
  canMove: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onMove: (statusId: string) => void;
  onTogglePin: () => void;
  onDelete: () => void;
  // The card's height when known; the host's first measure can come back 0.
  onDragStartCard: (height: number | null) => void;
  onDragEndCard: () => void;
  onDragOverCard: () => void;
  onDropCard: () => void;
};

// The type as a small filled square in the option's own colour, with a white
// mark inside: a tick for a task, a bookmark for a story, a dot for a bug and
// a branch for a subtask. Drawn here because no host component draws it.
export const IssueTypeGlyph = ({
  issueType,
  size = 14,
}: {
  issueType: string | null;
  size?: number;
}) => {
  const option = ISSUE_TYPE_OPTIONS.find(
    (candidate) => candidate.value === issueType,
  );
  const color = readTagColor(option?.color ?? 'blue').text;

  return (
    <span
      title={option === undefined ? undefined : t(option.label)}
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        height: size,
        width: size,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="3.5" fill={color} />
        {option?.value === 'STORY' ? (
          <path d="M5.5 4.5h5v7l-2.5-2l-2.5 2z" fill="#ffffff" />
        ) : option?.value === 'BUG' ? (
          <circle cx="8" cy="8" r="2.75" fill="#ffffff" />
        ) : option?.value === 'SUBTASK' ? (
          <path
            d="M5.5 4.5v5.5a1.5 1.5 0 0 0 1.5 1.5h3.5M5.5 7.5h5"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <path
            d="M5 8.2l2 2l4-4.4"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
    </span>
  );
};

// The unassigned slot keeps its place in the footer, so every card lines up
// and "nobody owns this" reads at a glance, the way Jira draws it.
export const UnassignedAvatar = ({ size }: { size: number }) => (
  <span
    title={t('Unassigned')}
    style={{
      alignItems: 'center',
      border: `1px dashed ${TASK_TOKENS.borderStrong}`,
      ...TASK_CIRCLE_STYLE,
      boxSizing: 'border-box',
      display: 'inline-flex',
      flexShrink: 0,
      height: size,
      justifyContent: 'center',
      width: size,
    }}
  >
    <IconUser size={Math.round(size * 0.6)} color={TASK_TOKENS.textLight} />
  </span>
);

// One Jira card: the title first, then epic and labels, then a footer of type,
// key and due date on the left and points, priority and owner on the right.
//
// Only the main area opens the detail drawer — the hover menu beside it must
// stay OUTSIDE that click target. A nested button with stopPropagation reads
// correct in real DOM, but the sandbox does not forward the call: the guest
// sees two separate serialized clicks and the card opens anyway. Siblings
// never have that problem.
export const TaskBoardCard = ({
  issue,
  statusOptions,
  assigneeName,
  assigneeAvatarUrl,
  epicName,
  epicColor,
  sprintName,
  reporterName,
  reporterAvatarUrl,
  hiddenFields,
  isDone,
  isSelected,
  isDragging,
  canMove,
  canDelete,
  onOpen,
  onMove,
  onTogglePin,
  onDelete,
  onDragStartCard,
  onDragEndCard,
  onDragOverCard,
  onDropCard,
}: TaskBoardCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  // Measured on hover, ahead of the drag, in case the drag's own measure is 0.
  // oxlint-disable-next-line twenty/no-state-useref
  const measuredHeightRef = useRef<number | null>(null);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const [isPinItemHovered, setIsPinItemHovered] = useState(false);
  // Two-step delete: the sandbox has no confirm dialog, so the first click
  // arms the button and the second executes. Disarmed whenever the menu
  // closes, so a stale arm can never survive to the next open.
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isPinned = isNonEmptyString(issue.pinnedAt);
  const dueLabel = readShortDate(issue.dueDate);
  const isOverdue = readIsOverdue(issue.dueDate, isDone);
  const labelOptions = (issue.labels ?? []).slice(0, 2);
  const extraLabelCount = (issue.labels ?? []).length - labelOptions.length;
  const tooltip = `${issue.issueKey ?? ''} ${issue.title ?? ''}`.trim();
  const isShown = (key: IssueCardFieldKey) => !hiddenFields.includes(key);
  const shownEpicName = isShown('epic') ? epicName : null;
  const shownSprintName = isShown('sprint') ? sprintName : null;
  const shownLabels = isShown('labels') ? labelOptions : [];
  const shownPoints =
    isShown('points') && typeof issue.storyPoints === 'number'
      ? issue.storyPoints
      : null;
  const shownDueLabel = isShown('dueDate') ? dueLabel : null;
  const development = issue.developmentSummary;
  const hasDevelopment =
    development !== undefined &&
    development.openPullRequestCount +
      development.branchCount +
      development.failedBuildCount +
      development.failedDeploymentCount +
      development.successfulProductionDeploymentCount >
      0;
  const hasProperties =
    shownEpicName !== null ||
    shownSprintName !== null ||
    shownLabels.length > 0 ||
    shownPoints !== null ||
    shownDueLabel !== null ||
    hasDevelopment;

  return (
    <div
      draggable={canMove}
      onDragStart={(event) => {
        // The sandbox proxy carries no dataTransfer, so the card id travels
        // on component state (onDragStartCard) instead — dataTransfer is a
        // best-effort extra for real browsers, never a requirement. Touching
        // it unguarded throws inside the handler, and the host turns every
        // such throw into its red banner plus an error toast.
        try {
          event.dataTransfer?.setData('text/plain', issue.id);

          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
          }
        } catch {
          // Sandbox proxy: state carries the payload.
        }

        const height = event.currentTarget.getBoundingClientRect().height;

        onDragStartCard(height > 0 ? height : measuredHeightRef.current);
      }}
      onDragEnd={onDragEndCard}
      onDragOver={onDragOverCard}
      onDrop={onDropCard}
      title={tooltip}
      onMouseEnter={(event) => {
        const height = event.currentTarget.getBoundingClientRect().height;

        if (height > 0) {
          measuredHeightRef.current = height;
        }

        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: TASK_TOKENS.background,
        border: `1px solid ${isSelected ? TASK_TOKENS.accent : isHovered ? TASK_TOKENS.borderStrong : TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        boxShadow: isSelected
          ? `0 0 0 2px ${TASK_TOKENS.accentSoft}`
          : isHovered && !isDragging
            ? TASK_TOKENS.shadowLight
            : 'none',
        boxSizing: 'border-box',
        cursor: isDragging ? 'grabbing' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        width: '100%',
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={tooltip}
        style={{
          alignItems: 'stretch',
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: TASK_TOKENS.fontFamily,
          gap: 6,
          margin: 0,
          padding: '9px 10px 9px 10px',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 6,
            minHeight: 20,
          }}
        >
          {isShown('priority') && (
            <TaskPriorityGlyph priority={issue.priority} shouldShowEmpty />
          )}
          {isShown('type') && (
            <span
              title={
                ISSUE_TYPE_OPTIONS.find(
                  (candidate) => candidate.value === issue.issueType,
                )?.label
              }
              style={{ display: 'inline-flex', flexShrink: 0 }}
            >
              <IssueTypeGlyph issueType={issue.issueType ?? null} />
            </span>
          )}
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {issue.issueKey ?? ''}
          </span>
          {isPinned && (
            <span
              title={t('Pinned')}
              style={{ display: 'inline-flex', flexShrink: 0 }}
            >
              <IconPinned size={13} color={TASK_TOKENS.accent} />
            </span>
          )}
          <span style={{ flex: 1 }} />
          {isShown('reporter') && reporterName !== null && (
            <span
              title={`${t('Reporter')}: ${reporterName}`}
              style={{ display: 'inline-flex', flexShrink: 0, opacity: 0.7 }}
            >
              <TaskAvatar
                name={reporterName}
                avatarUrl={reporterAvatarUrl}
                size={16}
                shouldShowTitle={false}
              />
            </span>
          )}
          {isShown('assignee') &&
            (assigneeName !== null ? (
              <TaskAvatar
                name={assigneeName}
                avatarUrl={assigneeAvatarUrl}
                size={20}
              />
            ) : (
              <UnassignedAvatar size={20} />
            ))}
        </span>

        <span
          style={{
            color: isDone ? TASK_TOKENS.textSecondary : TASK_TOKENS.textPrimary,
            display: '-webkit-box',
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: '18px',
            maxHeight: 54,
            overflow: 'hidden',
            overflowWrap: 'anywhere',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 3,
          }}
        >
          {issue.title ?? t('(No title)')}
        </span>

        {hasProperties && (
          <span
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {shownEpicName !== null && (
              <TaskChip
                title={t('Epic')}
                icon={
                  <TaskColorDot
                    color={readTagColor(epicColor ?? 'purple').text}
                  />
                }
              >
                {shownEpicName}
              </TaskChip>
            )}
            {shownSprintName !== null && (
              <TaskChip
                title={t('Sprint')}
                icon={<IconCalendarRepeat size={12} />}
              >
                {shownSprintName}
              </TaskChip>
            )}
            {shownLabels.map((label) => {
              const option = ISSUE_LABEL_OPTIONS.find(
                (candidate) => candidate.value === label,
              );

              return (
                <TaskChip
                  key={label}
                  icon={
                    <TaskColorDot
                      color={readTagColor(option?.color ?? 'gray').text}
                      size={6}
                    />
                  }
                >
                  {option?.label ?? label}
                </TaskChip>
              );
            })}
            {shownLabels.length > 0 && extraLabelCount > 0 && (
              <TaskChip>+{extraLabelCount}</TaskChip>
            )}
            {shownPoints !== null && (
              <TaskChip title={t('Story points')}>{shownPoints}</TaskChip>
            )}
            {shownDueLabel !== null && (
              <TaskChip
                title={isOverdue ? t('Overdue') : t('Due date')}
                tone={isOverdue ? 'danger' : 'default'}
                icon={<IconCalendarEvent size={12} />}
              >
                {shownDueLabel}
              </TaskChip>
            )}
            {development !== undefined &&
              development.openPullRequestCount > 0 && (
                <TaskChip
                  title={t('Open pull requests')}
                  icon={<IconArrowMerge size={12} />}
                >
                  {development.openPullRequestCount}
                </TaskChip>
              )}
            {development !== undefined &&
              development.openPullRequestCount === 0 &&
              development.branchCount > 0 && (
                <TaskChip
                  title={t('Branches')}
                  icon={<IconGitBranch size={12} />}
                >
                  {development.branchCount}
                </TaskChip>
              )}
            {development !== undefined &&
              development.failedBuildCount + development.failedDeploymentCount >
                0 && (
                <TaskChip
                  title={t('Build or deployment failed')}
                  tone="danger"
                  icon={<IconCircleX size={12} />}
                >
                  {t('Failed')}
                </TaskChip>
              )}
            {development !== undefined &&
              development.successfulProductionDeploymentCount > 0 && (
                <TaskChip
                  title={t('Deployed to production')}
                  icon={
                    <IconCheck size={12} color={readTagColor('green').text} />
                  }
                >
                  {t('Deployed')}
                </TaskChip>
              )}
          </span>
        )}
      </button>
      <span
        style={{
          display:
            (canMove || canDelete) && (isHovered || isMoveOpen)
              ? 'inline-flex'
              : 'none',
          position: 'absolute',
          right: isShown('assignee') ? 34 : 8,
          top: 8,
        }}
      >
        <button
          type="button"
          aria-label={t('Card actions')}
          title={t('Card actions')}
          onClick={() => setIsMoveOpen(!isMoveOpen)}
          style={{
            alignItems: 'center',
            background: TASK_TOKENS.background,
            border: `1px solid ${TASK_TOKENS.borderLight}`,
            borderRadius: TASK_TOKENS.radiusExtraSmall,
            boxShadow: TASK_TOKENS.shadowLight,
            cursor: 'pointer',
            display: 'inline-flex',
            padding: 2,
          }}
        >
          <IconDotsVertical size={14} color={TASK_TOKENS.textTertiary} />
        </button>
        {isMoveOpen && (
          <twenty-overlay
            offsetX={-180}
            offsetY={20}
            onClose={() => {
              setIsMoveOpen(false);
              setIsConfirmingDelete(false);
            }}
          >
            <div
              role="menu"
              style={{
                background: TASK_TOKENS.background,
                border: `1px solid ${TASK_TOKENS.border}`,
                borderRadius: TASK_TOKENS.radiusSmall,
                boxShadow: TASK_TOKENS.shadowStrong,
                boxSizing: 'border-box',
                maxHeight: 280,
                overflowY: 'auto',
                ...TASK_THIN_SCROLLBAR_STYLE,
                padding: 4,
                width: 200,
              }}
            >
              {canMove && (
                <>
                  {/* Keyed by state: the sandbox can keep a menu item's first
                      click handler, which would pin an issue already pinned. */}
                  <button
                    key={isPinned ? 'unpin' : 'pin'}
                    type="button"
                    role="menuitem"
                    onMouseEnter={() => setIsPinItemHovered(true)}
                    onMouseLeave={() => setIsPinItemHovered(false)}
                    onClick={() => {
                      onTogglePin();
                      setIsMoveOpen(false);
                    }}
                    style={{
                      alignItems: 'center',
                      background: isPinItemHovered
                        ? TASK_TOKENS.backgroundHover
                        : 'transparent',
                      border: 'none',
                      borderRadius: TASK_TOKENS.radiusSmall,
                      color: TASK_TOKENS.textPrimary,
                      cursor: 'pointer',
                      display: 'flex',
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 13,
                      gap: 8,
                      minHeight: 32,
                      padding: '0 8px',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    {isPinned ? (
                      <IconPinnedOff
                        size={14}
                        color={TASK_TOKENS.textSecondary}
                      />
                    ) : (
                      <IconPin size={14} color={TASK_TOKENS.textSecondary} />
                    )}
                    {isPinned ? t('Unpin') : t('Pin to top')}
                  </button>
                  <div
                    style={{
                      background: TASK_TOKENS.borderLight,
                      height: 1,
                      margin: '4px 0',
                      width: '100%',
                    }}
                  />
                  <span
                    style={{
                      color: TASK_TOKENS.textTertiary,
                      display: 'block',
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '6px 8px 4px 8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t('Move to')}
                  </span>
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      role="menuitem"
                      onMouseEnter={() => setHoveredStatus(status.value)}
                      onMouseLeave={() => setHoveredStatus(null)}
                      onClick={() => {
                        onMove(status.value);
                        setIsMoveOpen(false);
                      }}
                      style={{
                        alignItems: 'center',
                        background:
                          hoveredStatus === status.value
                            ? TASK_TOKENS.backgroundHover
                            : 'transparent',
                        border: 'none',
                        borderRadius: TASK_TOKENS.radiusSmall,
                        color: TASK_TOKENS.textPrimary,
                        cursor: 'pointer',
                        display: 'flex',
                        fontFamily: TASK_TOKENS.fontFamily,
                        fontSize: 13,
                        gap: 8,
                        minHeight: 32,
                        padding: '0 8px',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <span
                        style={{
                          background: readTagColor(status.color).text,
                          ...TASK_CIRCLE_STYLE,
                          flexShrink: 0,
                          height: 8,
                          width: 8,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {status.label}
                      </span>
                      {status.value === issue.statusId && (
                        <IconCheck size={14} color={TASK_TOKENS.accent} />
                      )}
                    </button>
                  ))}
                </>
              )}
              {canMove && canDelete && (
                <div
                  style={{
                    background: TASK_TOKENS.borderLight,
                    height: 1,
                    margin: '4px 0',
                    width: '100%',
                  }}
                />
              )}
              {canDelete && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    if (isConfirmingDelete) {
                      onDelete();
                      setIsConfirmingDelete(false);
                      setIsMoveOpen(false);
                    } else {
                      setIsConfirmingDelete(true);
                    }
                  }}
                  style={{
                    alignItems: 'center',
                    background: isConfirmingDelete
                      ? TASK_TOKENS.red
                      : 'transparent',
                    border: 'none',
                    borderRadius: TASK_TOKENS.radiusSmall,
                    color: isConfirmingDelete
                      ? '#ffffff'
                      : TASK_TOKENS.textDanger,
                    cursor: 'pointer',
                    display: 'flex',
                    fontFamily: TASK_TOKENS.fontFamily,
                    fontSize: 13,
                    fontWeight: isConfirmingDelete ? 600 : 400,
                    gap: 8,
                    minHeight: 32,
                    padding: '0 8px',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <IconTrash
                    size={14}
                    color={
                      isConfirmingDelete ? '#ffffff' : TASK_TOKENS.textDanger
                    }
                  />
                  {isConfirmingDelete
                    ? t('Confirm delete?')
                    : t('Delete issue')}
                </button>
              )}
            </div>
          </twenty-overlay>
        )}
      </span>
    </div>
  );
};
