import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconAlertCircle,
  IconBookmark,
  IconCalendarEvent,
  IconCheck,
  IconDotsVertical,
  IconHierarchy2,
  IconSquareCheck,
  IconTrash,
  IconUser,
} from 'twenty-ui/icon';

import { ISSUE_LABEL_OPTIONS } from '../../constants/issue-label-options';
import { ISSUE_TYPE_OPTIONS } from '../../constants/issue-type-options';
import { type BoardIssue } from '../../types/task-board';
import { TaskAvatar } from './task-avatar';
import { TaskPriorityGlyph } from './task-priority-glyph';
import { TaskTag } from './task-tag';
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
  isDone: boolean;
  isSelected: boolean;
  isDragging: boolean;
  // Moving and deleting change the issue for everyone, so they follow the
  // caller's grants on the project; a reader without them can only open it.
  canMove: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onMove: (statusId: string) => void;
  onDelete: () => void;
  onDragStartCard: () => void;
  onDragEndCard: () => void;
};

// Jira draws the type as a small glyph in the option's own colour: a green
// bookmark for a story, a blue tick for a task, a red bug, a grey subtask
// glyph. Reproduced rather than imported — no host component draws it.
const IssueTypeGlyph = ({ issueType }: { issueType: string | null }) => {
  const option = ISSUE_TYPE_OPTIONS.find(
    (candidate) => candidate.value === issueType,
  );
  const color = readTagColor(option?.color).text;
  const size = 14;

  switch (option?.value) {
    case 'STORY':
      return <IconBookmark size={size} color={color} />;
    case 'BUG':
      return <IconAlertCircle size={size} color={color} />;
    case 'SUBTASK':
      return <IconHierarchy2 size={size} color={color} />;
    default:
      return <IconSquareCheck size={size} color={color} />;
  }
};

const readShortDate = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string' || value === '') {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
};

const readIsOverdue = (
  value: string | null | undefined,
  isDone: boolean,
): boolean => {
  if (isDone || typeof value !== 'string' || value === '') {
    return false;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsed.getTime() < today.getTime();
};

// The unassigned slot keeps its place in the footer, so every card lines up
// and "nobody owns this" reads at a glance, the way Jira draws it.
const UnassignedAvatar = ({ size }: { size: number }) => (
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
  isDone,
  isSelected,
  isDragging,
  canMove,
  canDelete,
  onOpen,
  onMove,
  onDelete,
  onDragStartCard,
  onDragEndCard,
}: TaskBoardCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  // Two-step delete: the sandbox has no confirm dialog, so the first click
  // arms the button and the second executes. Disarmed whenever the menu
  // closes, so a stale arm can never survive to the next open.
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const dueLabel = readShortDate(issue.dueDate);
  const isOverdue = readIsOverdue(issue.dueDate, isDone);
  const labelOptions = (issue.labels ?? []).slice(0, 2);
  const extraLabelCount = (issue.labels ?? []).length - labelOptions.length;
  const tooltip = `${issue.issueKey ?? ''} ${issue.title ?? ''}`.trim();
  const hasTags = epicName !== null || labelOptions.length > 0;

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

        onDragStartCard();
      }}
      onDragEnd={onDragEndCard}
      title={tooltip}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: TASK_TOKENS.background,
        border: `1px solid ${isSelected ? TASK_TOKENS.accent : isHovered ? TASK_TOKENS.borderStrong : TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        boxShadow: isSelected
          ? `0 0 0 1px ${TASK_TOKENS.accent}`
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
          gap: 8,
          margin: 0,
          padding: '10px 12px',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span
          style={{
            color: TASK_TOKENS.textPrimary,
            display: '-webkit-box',
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            lineHeight: '18px',
            maxHeight: 54,
            overflow: 'hidden',
            overflowWrap: 'anywhere',
            paddingRight: 20,
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 3,
          }}
        >
          {issue.title ?? t('(No title)')}
        </span>

        {hasTags && (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {epicName !== null && (
              <TaskTag color="purple">{epicName}</TaskTag>
            )}
            {labelOptions.map((label) => {
              const option = ISSUE_LABEL_OPTIONS.find(
                (candidate) => candidate.value === label,
              );

              return (
                <TaskTag key={label} color={option?.color ?? 'gray'}>
                  {option?.label ?? label}
                </TaskTag>
              );
            })}
            {extraLabelCount > 0 && (
              <span
                style={{
                  alignSelf: 'center',
                  color: TASK_TOKENS.textTertiary,
                  fontFamily: TASK_TOKENS.fontFamily,
                  fontSize: 11,
                }}
              >
                +{extraLabelCount}
              </span>
            )}
          </span>
        )}

        <span
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 6,
            minHeight: 22,
            width: '100%',
          }}
        >
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
          <span
            style={{
              color: TASK_TOKENS.textTertiary,
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 12,
              fontWeight: 500,
              minWidth: 0,
              overflow: 'hidden',
              // Jira strikes the key, not the title, once the work is done:
              // the card stays readable while its state still shows.
              textDecoration: isDone ? 'line-through' : 'none',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {issue.issueKey ?? ''}
          </span>
          {isDone && (
            <span title={t('Done')} style={{ display: 'inline-flex', flexShrink: 0 }}>
              <IconCheck size={14} color={readTagColor('green').text} stroke={2.5} />
            </span>
          )}
          {dueLabel !== null && (
            <span
              title={isOverdue ? t('Overdue') : t('Due date')}
              style={{
                alignItems: 'center',
                background: isOverdue
                  ? readTagColor('red').background
                  : 'transparent',
                borderRadius: TASK_TOKENS.radiusExtraSmall,
                color: isOverdue
                  ? TASK_TOKENS.textDanger
                  : TASK_TOKENS.textSecondary,
                display: 'inline-flex',
                flexShrink: 0,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 11,
                fontWeight: isOverdue ? 600 : 400,
                gap: 2,
                height: 18,
                padding: isOverdue ? '0 4px' : 0,
              }}
            >
              <IconCalendarEvent
                size={12}
                color={
                  isOverdue ? TASK_TOKENS.textDanger : TASK_TOKENS.textTertiary
                }
              />
              {dueLabel}
            </span>
          )}
          <span style={{ flex: 1 }} />
          {typeof issue.storyPoints === 'number' && (
            <span
              title={t('Story points')}
              style={{
                alignItems: 'center',
                background: TASK_TOKENS.backgroundTertiary,
                borderRadius: 10,
                color: TASK_TOKENS.textSecondary,
                display: 'inline-flex',
                flexShrink: 0,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 11,
                fontWeight: 600,
                height: 18,
                justifyContent: 'center',
                minWidth: 18,
                padding: '0 6px',
              }}
            >
              {issue.storyPoints}
            </span>
          )}
          <TaskPriorityGlyph priority={issue.priority} />
          {assigneeName !== null ? (
            <TaskAvatar
              name={assigneeName}
              avatarUrl={assigneeAvatarUrl}
              size={22}
            />
          ) : (
            <UnassignedAvatar size={22} />
          )}
        </span>
      </button>
      <span
        style={{
          display:
            (canMove || canDelete) && (isHovered || isMoveOpen)
              ? 'inline-flex'
              : 'none',
          position: 'absolute',
          right: 6,
          top: 6,
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
                      color={isConfirmingDelete ? '#ffffff' : TASK_TOKENS.textDanger}
                    />
                    {isConfirmingDelete ? t('Confirm delete?') : t('Delete issue')}
                  </button>
                )}
              </div>
            </twenty-overlay>
          )}
        </span>
    </div>
  );
};
