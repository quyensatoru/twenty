import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconAlertCircle,
  IconBookmark,
  IconCalendarEvent,
  IconCheck,
  IconDotsVertical,
  IconFlag,
  IconHierarchy2,
  IconSquareCheck,
  IconTrash,
} from 'twenty-ui/icon';

import { ISSUE_LABEL_OPTIONS } from '../../constants/issue-label-options';
import { ISSUE_PRIORITY_OPTIONS } from '../../constants/issue-priority-options';
import { ISSUE_TYPE_OPTIONS } from '../../constants/issue-type-options';
import { type BoardIssue } from '../../types/task-board';
import { TaskAvatar } from './task-avatar';
import { TaskTag } from './task-tag';
import { readTagColor, TASK_TOKENS } from './task-tokens';

type TaskBoardCardProps = {
  issue: BoardIssue;
  statusOptions: readonly {
    value: string;
    label: string;
    color?: string | null;
  }[];
  assigneeName: string | null;
  assigneeAvatarUrl?: string | null;
  isDone: boolean;
  isSelected: boolean;
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

// One Jira card: key and type on the top line, title, labels, then a footer of
// priority, points, due date and owner.
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
  isDone,
  isSelected,
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

  const priorityOption = ISSUE_PRIORITY_OPTIONS.find(
    (candidate) => candidate.value === issue.priority,
  );
  const dueLabel = readShortDate(issue.dueDate);
  const isOverdue = readIsOverdue(issue.dueDate, isDone);
  const labelOptions = (issue.labels ?? []).slice(0, 2);
  const extraLabelCount = (issue.labels ?? []).length - labelOptions.length;
  const tooltip = `${issue.issueKey ?? ''} ${issue.title ?? ''}`.trim();

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', issue.id);
        onDragStartCard();
      }}
      onDragEnd={onDragEndCard}
      title={tooltip}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: TASK_TOKENS.background,
        border: `1px solid ${isSelected ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        boxShadow: isHovered ? TASK_TOKENS.shadowLight : 'none',
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 10px',
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
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: TASK_TOKENS.fontFamily,
          gap: 6,
          margin: 0,
          padding: 0,
          textAlign: 'left',
          width: '100%',
        }}
      >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 6,
          paddingRight: 24,
          width: '100%',
        }}
      >
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>
          <IssueTypeGlyph issueType={issue.issueType ?? null} />
        </span>
        <span
          style={{
            color: TASK_TOKENS.textTertiary,
            flex: 1,
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.2,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {issue.issueKey ?? ''}
        </span>
      </div>

      <span
        style={{
          color: TASK_TOKENS.textPrimary,
          display: '-webkit-box',
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          lineHeight: '18px',
          maxHeight: 36,
          overflow: 'hidden',
          overflowWrap: 'anywhere',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
        }}
      >
        {issue.title ?? t('(No title)')}
      </span>

      {(labelOptions.length > 0 || extraLabelCount > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
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
                color: TASK_TOKENS.textTertiary,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 11,
              }}
            >
              +{extraLabelCount}
            </span>
          )}
        </div>
      )}

      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 6,
          width: '100%',
        }}
      >
        {priorityOption !== undefined && (
          <span title={priorityOption.label} style={{ display: 'inline-flex' }}>
            <IconFlag
              size={14}
              color={readTagColor(priorityOption.color).text}
            />
          </span>
        )}
        {typeof issue.storyPoints === 'number' && (
          <span
            title={t('Story points')}
            style={{
              alignItems: 'center',
              background: TASK_TOKENS.backgroundTertiary,
              borderRadius: 10,
              color: TASK_TOKENS.textSecondary,
              display: 'inline-flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 11,
              fontWeight: 600,
              height: 20,
              justifyContent: 'center',
              minWidth: 20,
              padding: '0 6px',
            }}
          >
            {issue.storyPoints}
          </span>
        )}
        {dueLabel !== null && (
          <span
            title={issue.dueDate ?? ''}
            style={{
              alignItems: 'center',
              color: isOverdue
                ? TASK_TOKENS.textDanger
                : TASK_TOKENS.textSecondary,
              display: 'inline-flex',
              fontFamily: TASK_TOKENS.fontFamily,
              fontSize: 11,
              fontWeight: isOverdue ? 600 : 400,
              gap: 2,
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
        {assigneeName !== null && (
          <TaskAvatar
            name={assigneeName}
            avatarUrl={assigneeAvatarUrl}
            size={22}
          />
        )}
      </div>
      </button>
      <span
        style={{
          display: isHovered || isMoveOpen ? 'inline-flex' : 'none',
          position: 'absolute',
          right: 4,
          top: 4,
        }}
      >
          <button
            type="button"
            aria-label={t('Move to status')}
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
                  padding: 4,
                  width: 200,
                }}
              >
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
                      justifyContent: 'space-between',
                      minHeight: 32,
                      padding: '0 8px',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
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
                <div
                  style={{
                    background: TASK_TOKENS.borderLight,
                    height: 1,
                    margin: '4px 0',
                    width: '100%',
                  }}
                />
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
              </div>
            </twenty-overlay>
          )}
        </span>
    </div>
  );
};
